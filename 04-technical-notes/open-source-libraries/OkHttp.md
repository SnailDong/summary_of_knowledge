## 一、OKHttp请求整体流程
```kotlin
var okHttpClient = OkHttpClient.Builder().build()
var request = Request.Builder().url("https://www.baidu.com")
	.cacheControl(CacheControl.FORCE_CACHE)
	.build()
var call = okHttpClient.newCall(request)
// 同步请求
val executeResult = call.execute()
println(executeResult.isSuccessful)
executeResult.close()
// 异步请求
call.enqueue(object: Callback {
	override fun onFailure(call:Call,e:IOException){

	}
	override fun onResponse(call:Call,response:Response){

	}
})
```

OkHttp请求过程中最少只需要接触OkHttpClient、Request、Call、 Response，但是框架内部会进行大量的逻辑处理。OkHtppClient和Request的创建可以使用它为我们提供的Builder，而Call则是把Request交给OkHttpClient之后返回的一个已准备好执行的请求。

OkHttpClient中全是一些配置，比如代理的配置，SSL证书的配置等，而Call本身是一个接口，我们获得的实现为：RealCall

```kotlin
override fun newCall(request: Request): Call = RealCall(this, request, forWebSocket = false)

```

Call的execute代表了同步请求，而enqueue代表了异步请求，两者唯一的区别在于一个会直接发起网络连接，而另一个使用OkHttp内置的线程池来进行，这就涉及到了OkHttp的任务分发器和拦截器。

所有网络请求的逻辑大部分集中在拦截器中，但是在进入拦截器之前还需要依靠分发器来调配请求任务。

关于分发器与拦截器，我们在这里先简单介绍下，后续会有更加详细的讲解。

分发器：内部维护队列与线程池，完成请求调配；

拦截器：五大默认拦截器完成整个请求过程。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729649092372-5533fb9a-3aa6-4d17-8f0f-2f705da3260e.png)

整个网络请求过程大致如上所示：

1. 通过[建造者模式](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E5%BB%BA%E9%80%A0%E8%80%85%E6%A8%A1%E5%BC%8F&zhida_source=entity)构建OKHttpClient与 Request
2. OKHttpClient通过newCall发起一个新的请求
3. 通过分发器维护请求队列与线程池，完成请求调配
4. 通过五大默认拦截器完成请求重试，缓存处理，建立连接等一系列操作
5. 得到网络请求结果

## 二、OKHttp分发器是怎样工作的
Dispatcher(分发器)的主要作用就是调配请求任务的，内部包含一个线程池。Dispatcher就是来维护请求队列与线程池的，比如我们有100个[异步请求](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E5%BC%82%E6%AD%A5%E8%AF%B7%E6%B1%82&zhida_source=entity)，肯定不能把它们同时请求，而是应该把它们排队分个类，分为正在请求中的列表和正在等待的列表，等请求完成后，即可从等待中的列表中取出等待的请求，从而完成所有的请求。而同步请求各异步请求又略有不同。

Dispatcher的成员有

```kotlin
// 异步请求同时存在的最大请求
var maxRequests = 64

// 异步请求同一域名同时存在的最大请求
var maxRequestsPerHost = 5

// 闲置任务(没有请求时可执行一些任务，由使用者设置)
var idleCallback: Runnable? = null

private var executorServiceOrNull: ExecutorService? = null
@get:Synchronized
@get:JvmName("executorService") val executorService: ExecutorService
get() {
	if (executorServiceOrNull == null) {

		executorServiceOrNull = ThreadPoolExecutor(0, Int.MAX_VALUE, 60, TimeUnit.SECONDS,
												   SynchronousQueue(), threadFactory("$okHttpName Dispatcher", false))
	}
	return executorServiceOrNull!!
}
//准备执行的异步请求
private val readyAsyncCalls = ArrayDeque<AsyncCall>()

//正在执行的异步请求
private val runningAsyncCalls = ArrayDeque<AsyncCall>()

//正在执行的同步请求
private val runningSyncCalls = ArrayDeque<RealCall>()
```

### 1、分发器的线程池
重点看一下分发器的线程池，执行异步的正在执行列表中的任务

```kotlin
executorServiceOrNull = ThreadPoolExecutor(
						0,                  //核心线程数
						Int.MAX_VALUE, 		//最大线程数
						60, 				//空闲线程闲置时间
						TimeUnit.SECONDS,	//闲置时间单位
						SynchronousQueue(), //线程等待队列
						threadFactory("$okHttpName Dispatcher", false))//线程创建工厂
```

在OkHttp的分发器中的线程池定义如上，其实就和`Executors.newCachedThreadPool()`创建的线程一样。首先核心线程为0，表示线程池不会一直为我们缓存线程，线程池中所有线程都是在60s内没有工作就会被回收。而最大线程`Integer.MAX_VALUE`与等待队列`SynchronousQueue`的组合能够得到最大的吞吐量。即当需要线程池执行任务 时，如果不存在空闲线程不需要等待，马上新建线程执行任务！等待队列的不同指定了线程池的不同排队机制。一般来说，等待队列`BlockingQueue`有：`ArrayBlockingQueue`、`LinkedBlockingQueue`与`SynchronousQueue`。

假设向线程池提交任务时，核心线程都被占用的情况下：

`ArrayBlockingQueue`：基于数组的阻塞队列，初始化需要指定固定大小。

当使用此队列时，向线程池提交任务，会首先加入到等待队列中，当等待队列满了之后，再次提交任务，尝试加入队列就会失败，这时就会检查如果当前线程池中的线程数未达到最大线程，则会新建线程执行新提交的任务。所以最终可能出现后提交的任务先执行，而先提交的任务一直在等待。

`LinkedBlockingQueue`：基于链表实现的阻塞队列，初始化可以指定大小，也可以不指定。

当指定大小后，行为就和`ArrayBlockingQueu`一致。而如果未指定大小，则会使用默认的`Integer.MAX_VALUE`作为队列大小。这时候就会出现线程池的最大线程数参数无用，因为无论如何，向线程池提交任务加入等待队列都会成功。最终意味着所有任务都是在核心线程执行。如果核心线程一直被占，那就一直等待。

`SynchronousQueue`:无容量的队列。

使用此队列意味着希望获得最大并发量。因为无论如何，向线程池提交任务，往队列提交任务都会失败。而失败后如果没有空闲的非核心线程，就会检查如果当前线程池中的线程数未达到最大线程，则会新建线程执行新提交的任务。完全没有任何等待，唯一制约它的就是最大线程数的个数。因此一般配合`Integer.MAX_VALUE`就实现了真正的无等待。

但是需要注意的时，我们都知道，进程的内存是存在限制的，而每一个线程都需要分配一定的内存。所以线程并不能无限个数。那么当设置最大线程数为`Integer.MAX_VALUE`时，OkHttp同时还有最大请求任务执行个数：64的限制。这样即解决了这个问题同时也能获得最大吞吐。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729654647124-a96b03a1-a74f-40b9-bd4f-49325d894d50.png)

### 2、同步请求
```kotlin
override fun execute(): Response {
	check(executed.compareAndSet(false, true)) { "Already Executed" }

	timeout.enter()
	callStart()
	try {
		// 调用分发器
		client.dispatcher.executed(this)
		//执行请求
		return getResponseWithInterceptorChain()
	} finally {
		client.dispatcher.finished(this)
	}
}
```

```kotlin
  / Used by [Call.execute] to signal it is in-flight. */
  @Synchronized internal fun executed(call: RealCall) {
    runningSyncCalls.add(call)
  }
```

因为同步请求不需要线程池，也不存在任何限制。所以分发器仅做一下记录。后续按照加入队列的顺序同步请求即可。注意`check(executed.compareAndSet(false, true)) { "Already Executed" }`在执行前已经判断了该任务是否执行过了，重复执行会抛出异常。

### 3、异步请求
```kotlin
override fun enqueue(responseCallback: Callback) {
	check(executed.compareAndSet(false, true)) { "Already Executed" }

	callStart()
	client.dispatcher.enqueue(AsyncCall(responseCallback))
}
```

首先，和同步请求一样，都会判断该任务是否执行过。然后调用分发器的异步请求。

```kotlin
internal fun enqueue(call: AsyncCall) {
	synchronized(this) {
		readyAsyncCalls.add(call)

		// Mutate the AsyncCall so that it shares the AtomicInteger of an existing running call to
		// the same host.
		if (!call.call.forWebSocket) {
			val existingCall = findExistingCallWithHost(call.host)
			if (existingCall != null) call.reuseCallsPerHostFrom(existingCall)
		}
	}
	promoteAndExecute()
}
// 在正在执行和准备执行的队列里查找是否有同Host的请求
private fun findExistingCallWithHost(host: String): AsyncCall? {
	for (existingCall in runningAsyncCalls) {
		if (existingCall.host == host) return existingCall
	}
	for (existingCall in readyAsyncCalls) {
		if (existingCall.host == host) return existingCall
	}
	return null
}

// 选择可以执行的异步调用，并实际执行它们
private fun promoteAndExecute(): Boolean {
	// 确保当前线程没有持有锁，这是为了避免死锁
	this.assertThreadDoesntHoldLock()

	// 创建一个列表 executableCalls 来存储可以执行的调用
	val executableCalls = mutableListOf<AsyncCall>()
	val isRunning: Boolean
	synchronized(this) {

		val i = readyAsyncCalls.iterator()
		//迭代等待执行异步请求
		while (i.hasNext()) {
			val asyncCall = i.next()
			//正在执行异步请求的任务数 不能大于 64个
			if (runningAsyncCalls.size >= this.maxRequests) break // Max capacity.
			//同一个host的请求数 不能大于5
			if (asyncCall.callsPerHost.get() >= this.maxRequestsPerHost) continue // Host max capacity.

			i.remove()
			asyncCall.callsPerHost.incrementAndGet()
			executableCalls.add(asyncCall)  //需要开始执行的任务集合
			runningAsyncCalls.add(asyncCall)
		}
		isRunning = runningCallsCount() > 0
	}

	for (i in 0 until executableCalls.size) {
		val asyncCall = executableCalls[i]
		asyncCall.executeOn(executorService)
	}

	return isRunning
}

fun executeOn(executorService: ExecutorService) {
	client.dispatcher.assertThreadDoesntHoldLock()

	var success = false
	try {
		executorService.execute(this)
		success = true
	} catch (e: RejectedExecutionException) {
		val ioException = InterruptedIOException("executor rejected")
		ioException.initCause(e)
		noMoreExchanges(ioException)
		responseCallback.onFailure(this@RealCall, ioException)
	} finally {
		if (!success) {
			client.dispatcher.finished(this) // This call is no longer running!
		}
	}
}
```

执行异步请求时，`findExistingCallWithHost`查找准备队列和正在执行队列中是否存在同host的请求，如果存在，则复用这个host。call.reuseCallsPerHostFrom(existingCall)使得相同Host的请求，`callsPerHost`指向同一个`AtomicInteger`实例。`callsPerHost`是一个volitale的变量，使得使用同一个`AtomicInteger`的请求共享当前正在执行列表和准备列表同一host的数量。

> 例如：第一、二、三、四个host成功添加到runningAsyncCalls中，第五、六个个请求执行enqueue，因为enqueue内部加了synchronized锁所以先执行第五个请求先执行，并查询到当前正在执行队列里有四个同host的请求，所以第五个请求的`callsPerHost`==4表示已经有4个同host请求，然后执行promoteAndExecute，此时释放了锁，第六个请求可以执行enqueue的查询语句，可能同样查到是4个同host请求，但是第五个请求执行promoteAndExecute时又执行到了加锁逻辑，所以第五个请求先执行判断，当判断可以添加到正在执行队列后，从准备队列里删除第五个请求，然后将该请求的`callsPerHost`执行+1，因为`callsPerHost`对所有使用他的对象共享变量，所以第六个请求包括正在执行队列的四个同host请求的`callsPerHost`都变成了5，然后第五个请求继续执行将请求加入可执行调用列表和正在执行列表，最后释放锁，然后第六个请求拿到锁执行，但是因为第五个请求已经将`callsPerHost`变为了5，所以第六个请求判断同host不能大于等于5时命中，所以该请求不在执行，需要等待同host任务执行完毕空闲出一个位置再执行。因为一个任务执行完毕后会调用call.callsPerHost.decrementAndGet()使得该值减1，然后会重新执行promoteAndExecute，所以第六个请求在遍历准备列表时会继续判断一次是否添加到正在执行列表中。
>

```kotlin
@Volatile var callsPerHost = AtomicInteger(0)
private set

fun reuseCallsPerHostFrom(other: AsyncCall) {
	this.callsPerHost = other.callsPerHost
}
```

所以当promoteAndExecute开始要执行一个异步任务时，都会调用`asyncCall.callsPerHost.incrementAndGet()`，使得`callsPerHost`+1，相同host的请求每次`asyncCall.callsPerHost.get()`都会保证可以获取到同一host下正在执行异步请求的数量，最终保证`promoteAndExecute`代码中，判断正在执行的任务未超过最大限制64，同时同一Host的请求不超过5个，如果满足条件，则会把任务添加到正在执行队列，并从准备队列中移除，同时添加到可执行调用列表。最后将可执行调用列表中的任务开始执行。每个任务完成后，都会调用分发器的`finished`方法，这里面会取出等待队列中的任务继续执行。

```kotlin
// 异步请求调用
internal fun finished(call: AsyncCall) {
	call.callsPerHost.decrementAndGet()
	finished(runningAsyncCalls, call)
}

// 同步请求调用
internal fun finished(call: RealCall) {
	finished(runningSyncCalls, call)
}

private fun <T> finished(calls: Deque<T>, call: T) {
	val idleCallback: Runnable?
	synchronized(this) {
		// 不管同步异步，执行完都要从队列移除
		if (!calls.remove(call)) throw AssertionError("Call wasn't in-flight!")
		idleCallback = this.idleCallback
	}

	// 结束一个请求后重新调用promoteAndExecute，重新调配请求
	val isRunning = promoteAndExecute()

	// 没有任务执行 执行闲置任务
	if (!isRunning && idleCallback != null) {
		idleCallback.run()
	}
}
```

### 4、请求流程
用户不需要直接操作任务分发器，获得的RealCall中分别提供了execute和enqueue来进行同步和异步请求。

同步请求中调用分发器将任务添加到正在执行队列，然后调用`getResponseWithInterceptorChain`方法执行请求，

异步请求执行了线程池的execute,`executorService.execute(this)`，然后执行到RealCall的run方法

```kotlin
override fun run() {
	threadName("OkHttp ${redactedUrl()}") {
		var signalledCallback = false
		timeout.enter()
		try {
			// 执行请求
			val response = getResponseWithInterceptorChain()
			signalledCallback = true
			responseCallback.onResponse(this@RealCall, response)
		} catch (e: IOException) {
			if (signalledCallback) {
				// Do not signal the callback twice!
				Platform.get().log("Callback failure for ${toLoggableString()}", Platform.INFO, e)
			} else {
				responseCallback.onFailure(this@RealCall, e)
			}
		} catch (t: Throwable) {
			cancel()
			if (!signalledCallback) {
				val canceledException = IOException("canceled due to $t")
				canceledException.addSuppressed(t)
				responseCallback.onFailure(this@RealCall, canceledException)
			}
			throw t
		} finally {
			client.dispatcher.finished(this)
		}
	}
}
```

AsyncCall是RealCall的内部普通类，所以它持有外部类RealCall的引用，可以获得直接调用外部类的方法。

可以看到，最终异步请求也是执行了`getResponseWithInterceptorChain`方法。所以这个方法是OkHttp的核心：拦截器责任链。

### 5、拦截器责任链
首先看下`getResponseWithInterceptorChain`方法，在这个方法中实现责任链的构建和处理。

```kotlin
internal fun getResponseWithInterceptorChain(): Response {
	// Build a full stack of interceptors.
	val interceptors = mutableListOf<Interceptor>()
	interceptors += client.interceptors
	interceptors += RetryAndFollowUpInterceptor(client)
	interceptors += BridgeInterceptor(client.cookieJar)
	interceptors += CacheInterceptor(client.cache)
	interceptors += ConnectInterceptor
	if (!forWebSocket) {
		interceptors += client.networkInterceptors
	}
	interceptors += CallServerInterceptor(forWebSocket)

	val chain = RealInterceptorChain(
		call = this,
		interceptors = interceptors,
		index = 0,
		exchange = null,
		request = originalRequest,
		connectTimeoutMillis = client.connectTimeoutMillis,
		readTimeoutMillis = client.readTimeoutMillis,
		writeTimeoutMillis = client.writeTimeoutMillis
	)

	var calledNoMoreExchanges = false
	try {
		val response = chain.proceed(originalRequest)
		if (isCanceled()) {
			response.closeQuietly()
			throw IOException("Canceled")
		}
		return response
	} catch (e: IOException) {
		calledNoMoreExchanges = true
		throw noMoreExchanges(e) as Throwable
	} finally {
		if (!calledNoMoreExchanges) {
			noMoreExchanges(null)
		}
	}
}
```

请求会被交给责任链中的一个个拦截器，默认情况下有五大拦截器：

1. `RetryAndFollowUpInterceptor`第一个接触到的请求，最后接触到响应，负责判断是否需要重新发起整个请求
2. `BridgeInterceptor`补全请求，并对相应进行额外处理
3. `CacheInterceptor`请求前查询缓存，获得响应并判断是否需要缓存
4. `ConnectInterceptor`与服务器完成TCP连接
5. `CallServerInterceptor`与服务器通信，封装请求数据与解析响应数据(如：HTTP报文)

#### (1) 重试及重定向拦截器
`RetryAndFollowUpInterceptor`主要就是完成两件事请：重试和重定向。

#### (2) 重试
请求阶段发生了RouteException或者IOException会进行判断是否重新发起请求。

```kotlin
catch (e: RouteException) { //路由异常，连接未成功，请求未发出去
	// The attempt to connect via a route failed. The request will not have been sent.
	//检查是否需要重试
	if (!recover(e.lastConnectException, call, request, requestSendStarted = false)) {
		throw e.firstConnectException.withSuppressed(recoveredFailures)
	} else {
		recoveredFailures += e.firstConnectException
	}
	newExchangeFinder = false
	continue
}
```

```kotlin
catch (e: IOException) { //IO异常
	// 请求发出去了，但是和服务器通信失败了(socket流证字啊读写数据的时候断开连接)
	// HTTP2才会有ConnectionShutdownException 代表连接中断
	// 所以对于HTTP1 requestSendStarted一定是true
	//（若是HTTP2的连接中断异常仍然为false）
	if (!recover(e, call, request, requestSendStarted = e !is ConnectionShutdownException)) {
		throw e.withSuppressed(recoveredFailures)
	} else {
		recoveredFailures += e
	}
	newExchangeFinder = false
	continue
}
```

两个异常都是根据`recover`判断是否能够进行重试，如果返回true，则表示允许重试。

```kotlin
private fun recover(
	e: IOException,
	call: RealCall,
	userRequest: Request,
	requestSendStarted: Boolean
): Boolean {
	// The application layer has forbidden retries.
	// okhttpclient配置了不允许重试(默认允许)
	if (!client.retryOnConnectionFailure) return false

	// We can't send the request body again.
	// 不重试：
	// 1、如果是IO异常（非http2中断异常）表示请求可能发出
	// 2、如果请求体只能被使用一次（默认为false）
	if (requestSendStarted && requestIsOneShot(e, userRequest)) return false

	// This exception is fatal.
	// 异常不重试：协议异常、IO中断异常（除Socket读写超时之外），ssl认证异常
	if (!isRecoverable(e, requestSendStarted)) return false

	// No more routes to attempt.
	//是否有更多的路线
	if (!call.retryAfterFailure()) return false

	// For failure recovery, use the same route selector with a new connection.
	return true
}

// 某些异常下是否可以重试
private fun isRecoverable(e: IOException, requestSendStarted: Boolean): Boolean {
	// If there was a protocol problem, don't recover.
	// 协议异常 不重试
	if (e is ProtocolException) {
		return false
	}

	// If there was an interruption don't recover, but if there was a timeout connecting to a route
	// we should try the next route (if there is one).
	// 如果发生中断 不重试，但如果连接到路由时超时可以重试
	if (e is InterruptedIOException) {
		return e is SocketTimeoutException && !requestSendStarted
	}

	// Look for known client-side or negotiation errors that are unlikely to be fixed by trying
	// again with a different route.
	// 证书有问题 不重试
	if (e is SSLHandshakeException) {
		// If the problem was a CertificateException from the X509TrustManager,
		// do not retry.
		if (e.cause is CertificateException) {
			return false
		}
	}
	// 证书验证失败
	if (e is SSLPeerUnverifiedException) {
		// e.g. a certificate pinning error.
		return false
	}
	// An example of one we might want to retry with a different route is a problem connecting to a
	// proxy and would manifest as a standard IOException. Unless it is one we know we should not
	// retry, we return true and try a new route.
	return true
}
```

#### (3) 重定向
如果请求结束后没有发生异常并不代表当前获得的响应就是最终需要交给用户的，还要进一步来判断是否需要重定向的判断，重定向的判断位于`followUpRequest`方法。

```kotlin
private fun followUpRequest(userResponse: Response, exchange: Exchange?): Request? {
	val route = exchange?.connection?.route()
	val responseCode = userResponse.code

	val method = userResponse.request.method
	when (responseCode) {
		// 407 客户端使用了HTTP代理服务器，在请求头中添加“Proxy-Authorization”让代理服务器授权
		HTTP_PROXY_AUTH -> {
			val selectedProxy = route!!.proxy
			if (selectedProxy.type() != Proxy.Type.HTTP) {
				throw ProtocolException("Received HTTP_PROXY_AUTH (407) code while not using proxy")
			}
			return client.proxyAuthenticator.authenticate(route, userResponse)
		}

		// 401 需要身份验证 有些服务器接口需要验证使用者身份 在请求头中添加“Authorization”
		HTTP_UNAUTHORIZED -> return client.authenticator.authenticate(route, userResponse)

		//308 永久重定向
		//307 临时重定向
		//300 301 302 303
		HTTP_PERM_REDIRECT, HTTP_TEMP_REDIRECT, HTTP_MULT_CHOICE, HTTP_MOVED_PERM, HTTP_MOVED_TEMP, HTTP_SEE_OTHER -> {
			return buildRedirectRequest(userResponse, method)
		}

		// 408客户端请求超时
		HTTP_CLIENT_TIMEOUT -> {
			// 408's are rare in practice, but some servers like HAProxy use this response code. The
			// spec says that we may repeat the request without modifications. Modern browsers also
			// repeat the request (even non-idempotent ones.)
			// 408算是连接失败了，所以判断用户是不是允许重试
			if (!client.retryOnConnectionFailure) {
				// The application layer has directed us not to retry the request.
				return null
			}

			// UnrepeatableRequestBody实际并没发现有其他地方用到
			val requestBody = userResponse.request.body
			if (requestBody != null && requestBody.isOneShot()) {
				return null
			}

			// 如果是本身这次的响应就是重新请求的产物同时上一次之所以重请求还是因为408，
			// 那我们这次不再重请求
			val priorResponse = userResponse.priorResponse
			if (priorResponse != null && priorResponse.code == HTTP_CLIENT_TIMEOUT) {
				// We attempted to retry and got another timeout. Give up.
				return null
			}

			// 如果服务器告诉我们了Retry—After多久后重试，那框架不管了
			if (retryAfter(userResponse, 0) > 0) {
				return null
			}

			return userResponse.request
		}

		// 503 服务不可用 和408差不多，但是只在服务器告诉你Retry-After:0（意思是立即重试）才重请求
		HTTP_UNAVAILABLE -> {
			val priorResponse = userResponse.priorResponse
			if (priorResponse != null && priorResponse.code == HTTP_UNAVAILABLE) {
				// We attempted to retry and got another timeout. Give up.
				return null
			}

			if (retryAfter(userResponse, Integer.MAX_VALUE) == 0) {
				// specifically received an instruction to retry without delay
				return userResponse.request
			}

			return null
		}

		HTTP_MISDIRECTED_REQUEST -> {
			// OkHttp can coalesce HTTP/2 connections even if the domain names are different. See
			// RealConnection.isEligible(). If we attempted this and the server returned HTTP 421, then
			// we can retry on a different connection.
			val requestBody = userResponse.request.body
			if (requestBody != null && requestBody.isOneShot()) {
				return null
			}

			if (exchange == null || !exchange.isCoalescedConnection) {
				return null
			}

			exchange.connection.noCoalescedConnections()
			return userResponse.request
		}

		else -> return null
	}
}
```

```kotlin
private fun buildRedirectRequest(userResponse: Response, method: String): Request? {
	// 如果用户不允许重定向，那就返回null
	if (!client.followRedirects) return null

	// 从响应头取出location
	val location = userResponse.header("Location") ?: return null
	// 根据location配置新的请求url,
	// 如果为null，说明协议有问题，取不出来HttpUrl，那就返回null，不进行重定向
	val url = userResponse.request.url.resolve(location) ?: return null

	// 如果重定向在http到https之间切换，需要检查用户是不是允许（默认允许）
	val sameScheme = url.scheme == userResponse.request.url.scheme
	if (!sameScheme && !client.followSslRedirects) return null

	// Most redirects don't include a request body.
	val requestBuilder = userResponse.request.newBuilder()
	/
	 * 重定向请求中只要不是PROPFIND请求，无论是POST还是其他的方法都要改为GET请求方式，
	 * 即只有PROPFIND请求才能有请求体
	 */
	 // 请求不是get与head
	if (HttpMethod.permitsRequestBody(method)) {
		val responseCode = userResponse.code
		val maintainBody = HttpMethod.redirectsWithBody(method) ||
		responseCode == HTTP_PERM_REDIRECT ||
		responseCode == HTTP_TEMP_REDIRECT
		// 除了PROPFIND请求之外都改成GET请求
		if (HttpMethod.redirectsToGet(method) && responseCode != HTTP_PERM_REDIRECT && responseCode != HTTP_TEMP_REDIRECT) {
			requestBuilder.method("GET", null)
		} else {
			val requestBody = if (maintainBody) userResponse.request.body else null
			requestBuilder.method(method, requestBody)
		}
		if (!maintainBody) {
			requestBuilder.removeHeader("Transfer-Encoding")
			requestBuilder.removeHeader("Content-Length")
			requestBuilder.removeHeader("Content-Type")
		}
	}

	// When redirecting across hosts, drop all authentication headers. This
	// is potentially annoying to the application layer since they have no
	// way to retain them.
	// 在跨主机重定向时，删除身份验证请求头
	if (!userResponse.request.url.canReuseConnectionFor(url)) {
		requestBuilder.removeHeader("Authorization")
	}

	return requestBuilder.url(url).build()
}
```

整个是否需要重定向的判断内容很多，记不住，这很正常，关键在于理解他们的意思。如果此方法返回空，那就表示不需要再重定向了，直接返回响应；但是如果返回非空，那就要重新请求返回的Request，但是需要注意的是，我们的followup在拦截器中定义的最大次数为20次。

本拦截器是整个责任链中的第一个，这意味着它会是首次接触到Request与最后接收到Response的角色，在这个拦截器中主要功能就是判断是否需要重试与重定向。

重试的前提是出现了RouteException 或者IOException。一但在后续的拦截器执行过程中出现这两个异常，就会通过recover方法进行判断是否进行连接重试。

重定向发生在重试的判定之后，如果不满足重试的条件，还需要进一步调用followUpRequest 根据Response的响应码（当然，如果直接请求失败，Response都不存在就会抛出异常）。followup最大发生20次。

#### (4) 桥接拦截器
`BridgeInterceptor`连接应用程序和服务器的桥梁，我们发出的请求将会经过它的处理才能发给服务器，比如设置请求内容长度、编码、gzip的压缩、cookie等，获取响应后保存Cookie等操作。

补全请求头：


| 请求头 | 说明 |
| --- | --- |
| `Content-Type` | 请求体类型，如：`application/x-www-form-urlencoded` |
| `Content-Length`/`Transfer-Encoding` | 请求解析方式 |
| `Host` | 请求的主机站点 |
| `Connection:Keep-Alive` | 保持长连接 |
| `Accept-Encoding:gzip` | 接收响应支持gzip压缩 |
| `Cookie` | cookie身份辨别 |
| `User-Agent` | 请求的用户信息，如：操作系统、浏览器等 |


在补全了请求头后交给下一个拦截器处理，得到响应后，主要干两件事情：

1.保存cookie，在下次请求则会读取对应的数据设置进入请求头，默认的CookieJar不提供实现

2.如果使用gzip返回的数据，则使用GzipSource包装便于解析

总结:

对用户构建的Request进行添加或者删除相关头部信息，以转化成真正进行网络请求的Request，将符合网络请求规范的Request交给下一个拦截器处理，并获取Response，如果响应体经过了GZIP的压缩，那就需要解压，再构建成用户可用的Response并返回。

#### (5) 缓存拦截器
`CacheInterceptor`在发出请求前，判断是否命中缓存，如果命中则可以不请求，直接使用缓存的响应。(只会存在Get请求的缓存)

步骤为：

1. 从缓存中获得对应请求的响应缓存
2. 创建CacheStrategy,创建时会判断是否能够使用缓存，在CacheStrategy中存在两个成员：networkRequest与cacheResponse。组合如下

| networkRequest | cacheResponse | 说明 |
| --- | --- | --- |
| `Null` | `Not Null` | 直接使用缓存 |
| `Not Null` | `Null` | 向服务器发起请求 |
| `Null` | `Null` | 直接gg，okhttp直接返回504 |
| `Not Null` | `Not Null` | 发起请求，若得到响应为304(无修改),则更新缓存响应并返回 |


即：networkRequest存在则优先发起网络请求，否则使用cacheResponse缓存，若都不存在则请求失败。

3. 交给下一个责任链继续处理
4. 后续工作，返回304则用缓存的响应；否则使用网络响应并缓存本次响应(只缓存Get请求的响应)

缓存拦截器工作说起来简单，但具体实现内容很多，判断是否可以使用缓存或者请求服务器都是通过CacheStrategy判断。

Http的缓存我们可以按照行为将其分为：强缓存和协商缓存

命中强缓存时，浏览器并不会将请求发送给服务器。强缓存是利用http的返回头中的Expires或者CacheContril两个字段来控制的，用来表示资源的缓存时间。

若命中强缓存，则浏览器会将请求发送至服务器，服务器根据http头信息中的Last-Modify/if-Modify-Since或Etag/if-None-Match来判断是否命中协商缓存，如果命中，则http返回码为304，客户端从缓存中加载资源。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729663113354-42e69448-f113-44cd-98ea-6581cb02b558.png)

#### (6) 缓存检测


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729663129583-d368c33e-2121-4deb-aa83-a87220ff325b.png)

#### (7) 连接拦截器
`ConnectInterceptor`打开与目标服务器的连接，并执行下一个拦截器。

```kotlin
public final class ConnectInterceptor implements Interceptor {
	public final OkHttpClient client;
	public ConnectInterceptor (OkHttpClient client){
		this.client = client;
	}
	@Override public Response intercept(Chain chain) throws IOException {
		RealInterceptorChain realChain = (RealInterceptorChain) chain;
		Request request = realChain.request();
		StreamAllocation streamAllocation = realChain.streamAllocation();
		// We need the network to satisfy this request. Possibly for validating a conditional GET.
		boolean doExtensiveHealthChecks = !request.method().equals("GET");
		HttpCodec httpCodec = streamAllocation.newStream(client, chain, doExtensiveHealthChecks);
		RealConnection connection = streamAllocation.connection();
		return realChain.proceed(request, streamAllocation, httpCodec, connection);
	}
}
```

虽然代码量很少,实际上大部分功能都封装到其它类去了,这里只是调用而已。
首先我们看到的`StreamAllocation`这个对象是在第一个拦截器：重定向拦截器创建的，但是真正使用的地方却在这里。

"当一个请求发出,需要建立连接,连接建立后需要使用流用来读写数据”;而这个`StreamAllocation`就是协调请 求、连接与数据流三者之间的关系,它负责为一次请求寻找连接,然后获得流来实现网络通信。

这里使用的 newStream 方法实际上就是去查找或者建立一个与请求主机有效的连接，返回的 `HttpCodec` 中包含了 输入输出流，并且封装了对HTTP请求报文的编码与解码，直接使用它就能够与请求主机完成HTTP通信。
`StreamAllocation`中简单来说就是维护连接: `RealConnection`——封装了Socket与一个Socket连接池。可复用的 `RealConnection` 需要:

```kotlin
public boolean iseligible(Address address, @Nullable Route route) {
	// If this connection is not accepting new streams, we're done.
	if (allocations.size() >= allocationLimit || noNewStreams) return false;
	// If the non-host fields of the address don't overlap, we're done.
	if (!Internal.instance.equalsNonHost(this.route.address(), address)) return false;
	// If the host exactly matches, we're done: this connection can carry the address.
	if (address.url().host().equals(this.route().address().url().host())) {
		return true; // This connection is a perfect match.
	}
	// At this point we don't have a hostname match. But we still be able to carry the request if
	// our connection coalescing requirements are met. See also:
	// https://hpbn.co/optimizing-application-delivery/#eliminate-domain-sharding
	// https://daniel.haxx.se/blog/2016/08/18/http2-connection-coalescing/

	// 1. This connection must be HTTP/2.
	if (http2Connection==null) return false;

	// 2. The routes must share an IP address. This requires us to have a DNS address for both
	// hosts, which only happens after route planning. We can't coalesce connections that use a
	// proxy, since proxies don't tell us the origin server's IP address.
	if (route == null) return false;
	if (route.proxy().type() != Proxy.Type.DIRECT) return false;
	if (this.route.proxy().type() != Proxy.Type.DIRECT) return false;
	if (!this.route.socketAddress().equals(route.socketAddress())) return false;

	// 3. This connection's server certificate's must cover the new host.
	if (route.address(). ).hostnameVerifier() != OkHostnameVerifier.INSTANCE) return false;
	if (!supportsUrl(address.url())) return false;

	// 4. Certificate pinning must match the host.
	try {
		address.certificatepinner().check(address.url().host(),handshake(). peerCertificates());
	}catch (SSLPeerUnverifiedException e) {
		return false;
	}
	return true; // The caller's address can be carried by this connection.
}
```

1、`if (allocations.size() >= allocationLimit || noNewStreams) return false;`
连接到达最大并发流或者连接不允许建立新的流；如http1.x正在使用的连接不能给其他人用(最大并发流为:1)或者连接关闭；那就不允许复用；
2.

```kotlin
if (!Internal.instance.equalsNonHost(this.route.address(), address)) return false;
if (address.url().host().equals(this.routeu().address().url().host())){
	return true; // This connection is a perfect match.
}
```

DNS、代理、SSL证书、服务器域名、端口完全相同则可复用;
如果上述条件都不满足,在HTTP/2的某些场景下可能仍可以复用(http2先不管)。

所以综上,如果在连接池中找到个连接参数一致并且未被关闭没被占用的连接,则可以复用。

总结
这个拦截器中的所有实现都是为了获得一份与目标服务器的连接 在这个连接上进行HTTP数据的收发

#### (8) 请求服务器拦截器
`CallServerInterceptor`,利用`HttpCodec` 发出请求到服务器并且解析生成 `Response`
首先调用 `httpCodec.writeRequestHeaders(request);`将请求头写入到缓存中(直到调用`flushRequest()`才真正发 送给服务器)。然后马上进行第一个逻辑判断。

```kotlin
Response.Builder responseBuilder = null;
if (HttpMethod.permitsRequestBody(request.method()) && request.body() != null) {
	// If there's a "Expect: 100-continue" header on the request, wait for a "HTTP/1.1 100
	// Continue" response before transmitting the request body. If we don't get that, return
	// what we did get (such as a 4xx response) without ever transmitting the request body.
	if ("100-continue".equalsIgnoreCase(request.header("Expect"))) {
		httpCodec.flushRequest();
		realChain.eventListener().responseHeadersStart(realChain.call());
		responseBuilder =  httpCodec.readResponseHeaders(true);
	}
	if (responseBuilder == null) {
		// Write the request body if the "Expect: 100-continue" expectation was met.
		realChain.eventListener().requestBodyStart(realChain.call());
		long contentLength = request.body().contentLength();
		CountingSink requestBodyOut = new CountingSink(httpCodec.createRequestBody(request, contentLength));
		BufferedSink bufferedRequestBody = Okio.buffer(requestBodyOut);
		request.body().writeto(bufferedRequestBody);
		bufferedRequestBody.close();
		realChain.eventListener().requestBodyEnd(realChain.call(),requestBodyOut.successfulCount);
	} else if (!connection.isMultiplexed()) {
		//HTTP2多路复用,不需要关闭socket,不管!
		// If the "Expect: 100-continue" expectation wasn't met, prevent the HTTP/1
		// connection
		// from being reused. Otherwise we're still obligated to transmit the request // body to
		// leave the connection in a consistent state.
		streamAllocation.noNewStreams();
	}
}
httpCodec.finishRequest();
```

整个if都和一个请求头有关: `Expect: 100-continue` 。这个请求头代表了在发送请求体之前需要和服务器确定是否愿意接受客户端发送的请求体。所以 `permitsRequestBody` 判断为是否会携带请求体的方式(POST),如果命中 if,则会先给服务器发起一次查询是否愿意接收请求体,这时候如果服务器愿意会响应100(没有响应体,
responseBuilder 即为nul)。这时候才能够继续发送剩余请求数据。
但是如果服务器不同意接受请求体,那么我们就需要标记该连接不能再被复用,调用 `noNewStreams()` 关闭相关的 Socket。
后续代码为:

```kotlin
if (responseBuilder == null) {
	realChain.eventListener().responseHeadersStart(realChain.call());
	responseBuilder = httpCodec.readResponseHeaders(false);
}
}
Response response = responseBuilder
	.request(request)
	.handshake(streamAllocation.connection().handshake())
	.sentRequestAtMillis(sentRequestMillis)
	.receivedResponseAtMillis (System.currentTimeMillis())
	.build();
```

这时 responseBuilder 的情况即为:
1、POST方式请求,请求头中包含 Expect,服务器允许接受请求体,并且已经发出了请求体, responseBuilder 为null;
2、POST方式请求,请求头中包含 Expect,服务器不允许接受请求体, responseBuilder 不为null
3、POST方式请求,未包含 Expect,直接发出请求体, responseBuilder 为null;
4、POST方式请求,没有请求体, responseBuilder 为null;
5、GET方式请求, responseBuilder 为null;
对应上面的5种情况,读取响应头并且组成响应 Response,注意:此 Response 没有响应体。同时需要注意的是, 如果服务器接受 `Expect: 100-continue` 这是不是意味着我们发起了两次 Request? 那此时的响应头是第一次查询 服务器是否支持接受请求体的,而不是真正的请求对应的结果响应。所以紧接着:

```kotlin
int code = response.code();
if (code == 100) {
	// server sent a 100-continue even though we did not request one.
	// try again to read the actual response
	responseBuilder = httpCodec.readResponseHeaders(false);
	response responseBuilder
		.request(request)
		.handshake(streamAllocation.connection().handshake())
		.sentRequestAtMillis(sentRequestMillis)
		.receivedResponseatMillis(System.currentTimeMillis())
		.build();
	code = response.code();
```

如果响应是100,这代表了是请求`Expect: 100-continue`成功的响应,需要马上再次读取一份响应头,这才是真正
对应结果响应头。

然后收尾

```kotlin
if (forWebSocket && code == 101) {
	// Connection is upgrading, but we need to ensure interceptors see a non-null
	// response body.
	response = response.newBuilder()
		.body(Util.EMPTY_RESPONSE)
		.build();
} else {
	response = response.newBuilder()
		.body(httpCodec.openResponseBody(response)).build();
}
if ("close".equalsIgnoreCase(response.request().header("Connection"))
	|| "close".equalsIgnoreCase(response.header("Connection"))) {
	streamAllocation.noNewStreams();
}
if ((code == 204 || code == 205) && response.body().contentLength() > 0) {
	throw new ProtocolException(
		"HTTP " + code + "had non-zero Content-Length: "+ response.body().contentLength());
}
return response;
```

`forWebSocket` 代表`websocket`的请求,我们直接进入`else`,这里就是读取响应体数据。然后判断请求和服务器是不是都希望长连接,一旦有一方指明 `close`,那么就需要关闭 `socket`。而如果服务器返回`204/205`,一般情况而 言不会存在这些返回码,但是一旦出现这意味着没有响应体,但是解析到的响应头中包含`Content-Lenght` 且不为 0,这表响应体的数据字节长度。此时出现了冲突,直接抛出协议异常!

总结

在这个拦截器中就是完成HTTP协议报文的封装与解析。

### 6、OkHttp总结
整个OkHttp功能的实现就在这五个默认的拦截器中,所以先理解拦截器模式的工作机制是先决条件。这五个拦截器分别为:重试拦截器、桥接拦截器、缓存拦截器、连接拦截器、请求服务拦截器。每一个拦截器负责的工作不一样，就好像工厂流水线,最终经过这五道工序,就完成了最终的产品。

但是与流水线不同的是,OkHttp中的拦截器每次发起请求都会在交给下一个拦截器之前干一些事情,在获得了结果之后又干一些事情。整个过程在请求向是顺序的,而响应向则是逆序。

当用户发起一个请求后,会由任务分发起 Dispatcher 将请求包装并交给重试拦截器处理。

1. 重试拦截器在交出(交给下一个拦截器)之前,负责判断用户是否取消了请求;在获得了结果之后,会根据响应码判断是否需要重定向,如果满足条件那么就会重启执行所有拦截器。
2. 桥接拦截器在交出之前,负责将HTTP协议必备的请求头加入其中(如:Host)并添加一些默认的行为(如:GZIP
压缩);在获得了结果后,调用保存cookie接口并解析GZIP数据。
3. 缓存拦截器顾名思义,交出之前读取并判断是否使用缓存;获得结果后判断是否缓存。
4. 连接拦截器在交出之前,负责找到或者新建一个连接,并获得对应的socket流; 在获得结果后不进行额外的处理。
5. 请求服务器拦截器进行真正的与服务器的通信,向服务器发送数据,解析读取的响应数据。

在经过了这一系列的流程后,就完成了一次HTTP请求!

### 7、拦截器整体流程图

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729654625011-7be74b80-441e-4ad0-80f6-1b96e64c4aba.png)

## 三、应用拦截器和网络拦截器
```kotlin
val interceptors = mutableListOf<Interceptor>()
interceptors += client.interceptors
interceptors += RetryAndFollowUpInterceptor(client)
interceptors += BridgeInterceptor(client.cookieJar)
interceptors += CacheInterceptor(client.cache)
interceptors += ConnectInterceptor
if (!forWebSocket) {
	interceptors += client.networkInterceptors
}
interceptors += CallServerInterceptor(forWebSocket)
```

应用拦截器是`client.interceptors`，网络拦截器是`client.networkInterceptors`，都是用户自己定义的拦截器，

从整个责任链路来看，应用拦截器是最先执行的拦截器，也就是用户自己设置request属性后的原始请求，而网络拦截器位于`ConnectInterceptor`和`CallServerInterceptor`之间，此时[网络链路](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E7%BD%91%E7%BB%9C%E9%93%BE%E8%B7%AF&zhida_source=entity)已经准备好，只等待发送请求数据。它们主要有以下区别。

1. 首先，应用拦截器在`RetryAndFollowUpInterceptor`和`CacheInterceptor`之前，所以一旦发生错误重试或者网络重定向，网络拦截器可能执行多次，因为相当于进行了二次请求，但是应用拦截器永远只会触发一次。另外如果在`CacheInterceptor`中命中了缓存就不需要走网络请求了，因此会存在短路网络拦截器的情况。
2. 其次，除了`CallServerInterceptor`之外，每个拦截器都应该至少调用一次`realChain.proceed`方法。实际上在应用拦截器这层可以多次调用`proceed`方法（本地异常重试）或者不调用`proceed`方法（中断），但是网络拦截器这层连接已经准备好，可且仅可调用一次`proceed`方法。
3. 最后，从使用场景看，应用拦截器因为只会调用一次，通常用于统计[客户端](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E5%AE%A2%E6%88%B7%E7%AB%AF&zhida_source=entity)的网络请求发起情况；而网络拦截器一次调用代表了一定会发起一次网络通信，因此通常可用于统计网络链路上传输的数据。

## 四、OKHttp如何复用TCP连接
ConnectInterceptor的主要工作就是负责建立TCP连接，建立TCP连接需要经历三次握手四次挥手等操作，如果每个HTTP请求都要新建一个TCP消耗资源比较多。

而Http1.1已经支持keep-alive，即多个Http请求复用一个TCP连接，OKHttp也做了相应的优化，下面我们来看下OKHttp是怎么复用TCP连接的。

ConnectInterceptor中查找连接的代码会最终会调用到ExchangeFinder.findConnection方法，具体如下：

```kotlin
//为承载新的数据流寻找连接。寻找顺序是已分配的连接、连接池、新建连接
private RealConnectionfindConnection(intconnectTimeout,intreadTimeout,intwriteTimeout, intpingIntervalMillis,booleanconnectionRetryEnabled)throwsIOException{
	synchronized(connectionPool){
		//1.尝试使用已给数据流分配的连接.（例如重定向请求时，可以复用上次请求的连接）
		releasedConnection=transmitter.connection;
		result=transmitter.connection;
		if(result==null){
			// 2\. 没有已分配的可用连接，就尝试从连接池获取。（连接池稍后详细讲解）
			if(connectionPool.transmitterAcquirePooledConnection(address,transmitter,null,false)){
				result=transmitter.connection;
			}
		}
	}
	synchronized(connectionPool){
		if(newRouteSelection){
			//3. 现在有了IP地址，再次尝试从连接池获取。
			// 可能会因为连接合并而匹配。（这里传入了routes，上面的传的null）
			routes=routeSelection.getAll();
			if(connectionPool.transmitterAcquirePooledConnection(address,transmitter,routes,false)){
				foundPooledConnection=true; result=transmitter.connection;
			}
		}
		//4.第二次没成功，就把新建的连接，进行TCP+TLS握手，
		//与服务端建立连接.是阻塞操作
		result.connect(connectTimeout,readTimeout,writeTimeout,pingIntervalMillis, connectionRetryEnabled,call,eventListener);
		synchronized(connectionPool){
			//5\.最后一次尝试从连接池获取，注意最后一个参数为true，
			//即要求多路复用（http2.0） //意思是，如果本次是http2.0，
			//那么为了保证多路复用性，（因为上面的握手操作不是线程安全）
			//会再次确认连接池中此时是否已有同样连接
			if(connectionPool.transmitterAcquirePooledConnection(address,transmitter,routes,true)){
				//如果获取到，就关闭我们创建里的连接，返回获取的连接
				result=transmitter.connection;
			}else{
				//最后一次尝试也没有的话，就把刚刚新建的连接存入连接池
				connectionPool.put(result);
			}
		}
		returnresult;
	}
}
```

上面精简了部分代码，可以看出，连接拦截器使用了5种方法查找连接。

1. 首先会尝试使用 已给请求分配的连接。（已分配连接的情况例如重定向时的再次请求，说明上次已经有了连接）
2. 若没有 已分配的可用连接，就尝试从连接池中匹配获取。不考虑[路由信息](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E8%B7%AF%E7%94%B1%E4%BF%A1%E6%81%AF&zhida_source=entity)，所以匹配条件：address一致——host、port、代理等一致，且匹配的连接可以接受新的请求。
3. 若从连接池没有获取到，则传入routes再次尝试获取，此时考虑路由信息 尝试找到与路由相匹配的连接，这主要是针对Http2.0的一个操作，Http2.0可以复用[http://square.com](https://link.zhihu.com/?target=http%3A//square.com)与[http://square.ca](https://link.zhihu.com/?target=http%3A//square.ca)的连接
4. 若第二次也没有获取到，就创建RealConnection实例，进行TCP + TLS握手，与服务端建立连接。
5. 此时为了确保Http2.0连接的多路复用性，会第三次从连接池匹配。因为新建立的连接的握手过程是非线程安全的，所以此时可能连接池新存入了相同的连接。。
6. 第三次若匹配到，就使用已有连接，释放刚刚新建的连接；若未匹配到，则把新连接存入连接池并返回。

以上就是连接拦截器尝试复用连接的操作，[流程图](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E6%B5%81%E7%A8%8B%E5%9B%BE&zhida_source=entity)如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729657641810-f318183c-4866-46fd-afaf-bcce4f87b103.png)

## 五、OKHttp空闲连接如何清除？
上面说到我们会建立一个TCP连接池，但如果没有任务了，空闲的连接也应该及时清除，OKHttp是如何做到的呢？

```kotlin
private val cleanupQueue:TaskQueue=taskRunner.newQueue()
private val cleanupTask=object:Task("$okHttpNameConnectionPool"){
	overridefunrunOnce():Long=cleanup(System.nanoTime())
}
longcleanup(longnow){
	intinUseConnectionCount=0;//正在使用的连接数
	intidleConnectionCount=0;//空闲连接数
	RealConnectionlongestIdleConnection=null;//空闲时间最长的连接
	longlongestIdleDurationNs=Long.MIN_VALUE;//最长的空闲时间
	//遍历连接：找到待清理的连接, 找到下一次要清理的时间（还未到最大空闲时间）
	synchronized(this){
		for(Iterator<RealConnection>i=connections.iterator();i.hasNext();){
			RealConnectionconnection=i.next();
			//若连接正在使用，continue，正在使用连接数+1
			if(pruneAndGetAllocationCount(connection,now)>0){
				inUseConnectionCount++;
				continue;
			}
			//空闲连接数+1
			idleConnectionCount++;
			//赋值最长的空闲时间和对应连接
			longidleDurationNs=now-connection.idleAtNanos;
			if(idleDurationNs>longestIdleDurationNs){
				longestIdleDurationNs=idleDurationNs;
				longestIdleConnection=connection;
			}
		}
		//若最长的空闲时间大于5分钟或空闲数大于5，就移除并关闭这个连接
		if(longestIdleDurationNs>=this.keepAliveDurationNs ||idleConnectionCount>this.maxIdleConnections){
			connections.remove(longestIdleConnection);
		}else if(idleConnectionCount>0){
			//else，就返回还剩多久到达5分钟，然后wait这个时间再来清理
			returnkeepAliveDurationNs-longestIdleDurationNs;
		}else if(inUseConnectionCount>0){
			//连接没有空闲的，就5分钟后再尝试清理.
			returnkeepAliveDurationNs;
		}else{
			//没有连接，不清理
			cleanupRunning=false;
			return-1;
		}
	}
	//关闭移除的连接
	closeQuietly(longestIdleConnection.socket());
	//关闭移除后立刻进行下一次的尝试清理
	return0;
}
```

思路还是很清晰的：

1. 在将连接加入连接池时就会启动定时任务。
2. 有空闲连接的话，如果最长的空闲时间大于5分钟或空闲数大于5，就移除关闭这个最长空闲连接；如果空闲数不大于5且最长的空闲时间不大于5分钟，就返回到5分钟的剩余时间，然后等待这个时间再来清理。
3. 没有空闲连接就等5分钟后再尝试清理。
4. 没有连接不清理。

流程如下图所示：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729665839061-8dcd9819-1e99-4dd8-bc25-f88cef79992f.png)

## 六、OKHttp有哪些优点？
1. 使用简单，在设计时使用了外观模式，将整个系统的复杂性给隐藏起来，将子系统接口通过一个客户端OkHttpClient统一暴露出来。
2. 扩展性强，可以通过自定义应用拦截器与网络拦截器，完成用户各种自定义的需求
3. 功能强大，支持Spdy、Http1.X、Http2、以及WebSocket等多种协议
4. 通过连接池复用底层TCP(Socket)，减少请求延时
5. 无缝的支持GZIP减少数据流量
6. 支持数据缓存，减少重复的网络请求
7. 支持请求失败自动重试主机的其他ip，自动重定向

## 七、OKHttp框架中用到了哪些设计模式？
1. [构建者模式](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E6%9E%84%E5%BB%BA%E8%80%85%E6%A8%A1%E5%BC%8F&zhida_source=entity)：OkHttpClient与Request的构建都用到了构建者模式。
2. 外观模式：OkHttp使用了外观模式,将整个系统的复杂性给隐藏起来，将子系统接口通过一个客户端OkHttpClient统一暴露出来。
3. 责任链模式：OKHttp的核心就是责任链模式，通过5个默认拦截器构成的责任链完成请求的配置。
4. [享元模式](https://zhida.zhihu.com/search?content_id=222309565&content_type=Article&match_order=1&q=%E4%BA%AB%E5%85%83%E6%A8%A1%E5%BC%8F&zhida_source=entity)：享元模式的核心即池中复用，OKHttp复用TCP连接时用到了连接池，同时在异步请求中也用到了线程池。

