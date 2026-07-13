## 一、Retrofit和okhttp
### 1、Retrofit是什么？
准确来说，Retrofit 是一个 [RESTful](https://so.csdn.net/so/search?q=RESTful&spm=1001.2101.3001.7020) 的 HTTP 网络请求框架的封装。
原因：网络请求的工作本质上是 OkHttp 完成，而 Retrofit 仅负责 网络请求接口的封装。
我们先来看看下面这个图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729685419662-109b0f40-eab6-453e-b204-2a3bf33babc2.png)

上图说明了如下几点：

1. App应用程序通过 Retrofit 请求网络，实际上是使用 Retrofit 接口层封装请求参数、Header、Url 等信息，之后由 OkHttp 完成后续的请求操作。

2. 在服务端返回数据之后，OkHttp 将原始的结果交给 Retrofit，Retrofit根据用户的需求对结果进行解析。

所以，网络请求的本质仍旧是OkHttp完成的，retrofit只是帮使用者来进行工作简化的，比如配置网络，处理数据等工作，提高这一系列操作的复用性。这也就是网上流行的一个不太准确的总结：OkHttp是瑞士军刀，retrofit则是将瑞士军刀包装成了一个非常好用的指甲钳。

二： Retrofit 对Okhttp做了什么

Retrofit并没有改变网络请求的本质，也无需改变，因为Okhttp已经足够强大，Retrofit的封装可以说是很强大，里面涉及到一堆的设计模式,可以通过注解直接配置请求，可以使用不同的http客户端，虽然默认是用http ，可以使用不同Json Converter 来序列化数据，同时提供对RxJava的支持，使用Retrofit + OkHttp + RxJava 可以说是目前比较潮的一套框架，但是需要有比较高的门槛。

下面我们来对比一下OKhttp网络请求和 retrofit网络请求的区别。

### 2、回顾下okhttp
okhttp的优点：

+ 支持Http1、Http2、Quic以及WebSocket；
+ 连接池复用底层TCP(Socket)，减少请求延时；
+ 无缝的支持GZIP减少数据流量；
+ 缓存响应数据减少重复的网络请求；
+ 请求失败自动重试主机的其他ip，自动重定向；

### 3、okhttp请求的使用：
```kotlin
private void testOkHttp() throws IOException {
	//Step1
	final OkHttpClient client = new OkHttpClient();
	//Step2
	final Request request = new Request.Builder()
		.url("https://www.google.com.hk").build();
	//Step3
	Call call = client.newCall(request);
	//step4 发送网络请求，获取数据，进行后续处理
	call.enqueue(new Callback() {
		@Override
		public void onFailure(Call call, IOException e) {

		}

		@Override
		public void onResponse(Call call, Response response) throws IOException {
			Log.i(TAG,response.toString());
			Log.i(TAG,response.body().string());
		}
	});
}
```

Step1：创建HttpClient对象，也就是构建一个网络类型的实例，一般会将所有的网络请求使用同一个单例对象。

Step2：构建Request，也就是构建一个具体的网络请求对象，具体的请求url，请求头，请求体等等。

Step3：构建请求Call，也就是将具体的网络请求与执行请求的实体进行绑定，形成一个具体的正式的可执行实体。

Step4：后面就进行网络请求了，然后处理网络请求的数据了。

总结一下

OKhttp的意义：OkHttp是基于Http协议封装的一套请求客户端，虽然它也可以开线程，但根本上它更偏向真正的请求，跟HttpClient,HttpUrlConnection的职责是一样的。

OkHttp的职责：OkHttp主要负责socket部分的优化，比如多路复用，buffer缓存，数据压缩等等。

上述是一个简单的okhttp的使用，虽然okhttp已经足够强大了，但是仍然给用户留下了一些问题：

1. 用户网络请求的接口配置繁琐，尤其是需要配置请求的body，请求头，参数的时候


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1729667450300-9f33d9c4-c3e4-4244-bbe4-d53ab1a4e433.jpeg)

2. 数据解析过程需要用户手动拿到responsbody进行解析，不能复用
3. 无法适配自行进行线程的切换

所以Retrofit就来了，它是对okhttp的封装，使得用户可以更加方便简单的使用okhttp，

Retrofit改造后：


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1729667601701-4bc73785-6f15-43dc-bbc9-8c39dc126723.jpeg)

举一个例子，如果使用okhttp我们进行网络请求后，收到response仍然需要进一步网络请求，那就需要一层层嵌套，在每一个请求的response里进行新的request。所以okhttp使用起来是有很多不便的。


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1729667553578-49449dfc-3ec3-46dd-a2ff-ebbffde9b1f5.jpeg)

## 二、Retrofit请求流程总结
1. 引用，在gradle文件中引用retrofit
2. 定义接口，Retrofit要求定义一个网络请求的接口，接口函数里要定义url路径、请求参数、返回类型。
3. 依次获得Retrofit对象、接口实例对象、网络工作对象
    - 首先，需要新建一个retrofit对象。
    - 然后，根据上一步的接口，实现一个retrofit加工过的接口对象。
    - 最后，调用接口函数，得到一个可以执行网络访问的网络工作对象。
4. 访问网络数据，用上一步获取的worker对象，执行网络请求，在回调函数里，取得我们需要的BizEntity数据对象。网络访问结束。

### 1、retrofit网络请求相关依赖
```kotlin
// gson生成和解析库
implementation 'com.google.code.gson:gson:2.8.0'
// 开源的网络请求库
implementation 'com.squareup.okhttp3:okhttp:3.9.1'
// 支持okhttp跟踪到一个网络请求的所有状态，包括请求头、请求体、响应行、 响应体,
// 方便调试
implementation 'com.squareup.okhttp3:logging-interceptor:3.9.1'
// 实现将HTTP请求转换为Java接口
implementation 'com.squareup.retrofit2:retrofit:2.3.0'
// 配合Rxjava 使用
implementation 'com.squareup.retrofit2:adapter-rxjava:2.1.0'
// 转换器，请求结果转换成Model
implementation 'com.squareup.retrofit2:converter-gson:2.1.0'
implementation 'io.reactivex:rxandroid:1.2.1'
// 一种帮助你做异步的框架. 类似于 AsyncTask. 但其灵活性和扩展性远远强于前者.
// 从能力上讲, 如果说 AsycnTask 是 DOS 操作系统, RxJava 是 Window 操作系统。
implementation 'io.reactivex:rxjava:1.2.1'
```

### 2、创建用于描述网络请求的接口
```kotlin
public interface GetRequest_Interface {

	@GET("openapi.do?keyfrom=abc&key=2032414398&type=data&doctype=json&version=1.1&q=car")
	Call<Reception> getCall(@Field("name") String name);
	// @GET注解的作用:采用Get方法发送网络请求

	// getCall() = 接收网络请求数据的方法
	// 其中返回类型为Call<*>，*是接收数据的类（即上面定义的Translation类）
	// 如果想直接获得Responsebody中的内容，可以定义网络请求返回值为Call<ResponseBody>
}

```

### 3、创建Retrofit实例
```java
//step1
Retrofit retrofit = new Retrofit.Builder()
		.baseUrl("https://www.wanandroid.com/")
		.addConverterFactory(GsonConverterFactory.create(new Gson()))
		.build();

```

### 4、发送请求
```java
//step2
ISharedListService sharedListService =  retrofit.create(ISharedListService.class);
//step3
Call<SharedListBean> sharedListCall = sharedListService.getSharedList(2,1);
//step4
sharedListCall.enqueue(new Callback<SharedListBean>() {
	@Override
	public void onResponse(Call<SharedListBean> call, Response<SharedListBean> response{
		if (response.isSuccessful()) {
			System.out.println(response.body().toString());
		}
	}
	@Override
	public void onFailure(Call<SharedListBean> call, Throwable t) {
		t.printStackTrace();
	}
});
```

以上是利用Retrofit向buaseurl接口发送一个get请求。

Step1: 创建retrofit对象， 构建一个网络请求的载体对象，和okhttp构建OkhttpClient对象有一样的意义，只不过retrofit在build的时候有非常多的初始化内容，这些内容可以为后面网络请求提供准备，如准备 现成转换Executor，Gson convert，RxJavaCallAdapter。

Step2：Retrofit的精髓，为统一配置网络请求完成动态代理的设置。

Step3：构建具体网络请求对象Request（service），在这个阶段要完成的任务：1）将接口中的注解翻译成对应的参数；2）确定网络请求接口的返回值response类型以及对应的转换器；3）将Okhttp的Request封装成为Retrofit的OKhttpCall。总结来说，就是根据请求service 的Interface来封装Okhttp请求Request。

Step4：后面就进行网络请求了，然后处理网络请求的数据了。

> 注：baseUrl("")中的url必须以'/'结尾，否则会报异常；@GET("public")中的url如果是需要拼接在baseUrl之后的则不要以'/'开头
>

response.body()就是Reception对象，

`网络请求的完整 Url` =`在创建Retrofit实例时通过.baseUrl()设置` + `网络请求接口的注解设置（下面称path）`

整合的规则如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683469565-d35f959a-5c0e-44b6-97ca-abd607e1d25c.png)

### 5、总结一下
Retrofit主要负责应用层面的封装，就是说主要面向开发者，方便使用，比如请求参数，响应数据的处理，错误处理等等。

Retrofit封装了具体的请求，线程切换以及数据转换。

网上一般都推荐RxJava+Retrofit+OkHttp框架，Retrofit负责请求的数据和请求的结果，使用接口的方式呈现，OkHttp负责请求的过程，RxJava负责异步，各种线程之间的切换，用起来非常便利。

通过下图，让我们来总结一下，retrofit是如何来封装okhttp请求的。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729684543321-f2a495c8-e71b-4378-8ee7-91ba1f09e151.png)

大体的网络流程是一致的，毕竟都是通过okhttp进行网络请求。主要的步骤都是：创建网络请求实体client->构建真

正的网络请求-> 将网络请求方案与真正的网络请求实体结合构成一个请求Call->执行网络请求->处理返回数据->处理

Android 平台的线程问题。

在上图中，我们看到的对比最大的区别是什么？

0）okhttp创建的是OkhttpClient，然而retrofit创建的是 Retrofit实例

1）构建蓝色的Requet的方案，retrofit是通过注解来进行的适配

2）配置Call的过程中，retrofit是利用Adapter适配的Okhttp 的Call

3）相对okhttp，retrofit会对responseBody进行 自动的Gson解析

4）相对okhttp，retrofit会自动的完成线程的切换。

那么retrofit是如何完成这几点的封装的呢？

## 三、Retrofit的构建过程
Retrofit通过build模式来生成一个Retrofit对象，通过代码我们知道，Retrofit默认会使用OkHttp来发送网络请求，当然，我们也可以自己定制。

```java
public Retrofit build() {
	if (baseUrl == null) {
		throw new IllegalStateException("Base URL required.");
	}
	// 代码1
	//默认只支持okhttp请求，不支持 httpurlconnection 和 httpclient
	okhttp3.Call.Factory callFactory = this.callFactory;
	if (callFactory == null) {
		callFactory = new OkHttpClient();
	}
	// 代码2
	// 添加一个线程管理 Executor,okhttp 切换线程需要手动操作，但是retrofit
	// 不需要，就是因为这个Executor 的存在，其实他是handler
	Executor callbackExecutor = this.callbackExecutor;
	if (callbackExecutor == null) {
		callbackExecutor = platform.defaultCallbackExecutor();
	}
	//代码3
	// Make a defensive copy of the adapters and add the default Call adapter.
	List<CallAdapter.Factory> adapterFactories = new ArrayList<>(this.adapterFactories);
	adapterFactories.add(platform.defaultCallAdapterFactory(callbackExecutor));
	// Make a defensive copy of the converters.
	List<Converter.Factory> converterFactories = new ArrayList<>
	(this.converterFactories);
	return new Retrofit(callFactory, baseUrl, unmodifiableList(converterFactories),
						unmodifiableList(callAdapterFactories), callbackExecutor, validateEagerly);
}
```

1：在代码 1 处

初始化构建call 的工厂，但是这个地方直接就是使用了 okhttp的call，没有使用到工厂设计模式去添加构建httpclient 或者 httpurlconnection的方法来创建 call，说明retrofit 已经铁下心只支持okhttp创建call请求了。

那么call 是什么的抽象呢？看下面的代码，okhttp请求的代码

```java
OkHttpClient client = new OkHttpClient.Builder().
		readTimeout(5, TimeUnit.SECONDS).build();
Request request = new Request.Builder().
		url("http://www.baidu.com").get().build();
okhttp3.Call call = client.newCall(request);
		call.enqueue(new okhttp3.Callback() ）...
```

OkHttpClient是 http 请求的载体包含socket等可以复用的对象，协议配置等等一切。

Request 创建的是一个具体的有url，header，等请求信息的一个网络请求，表示这个具体的请求。

Call 通往请求的，去执行请求的整个过程的一个抽象。也是进行网络请求的最终接口。

所以，此次调用，目的就是创建了一个OkHttpClient，换句话说，这里的调用就是生产 Okhttp网络请求需要的请求Call的，以备后面进行真正的网络请求。

2：在代码2处

网络请求需要在子线程中执行，那么就需要线程管理，所以就有了代码2的存在，深入源码后发现，这个地方就是运用handler进行线程切换，当网络请求回来了进行线程切换，可以看下面的源码

```java
static final class Android extends Platform {
	Android() {
		super(Build.VERSION.SDK_INT >= 24);
	}
	@Override public Executor defaultCallbackExecutor() {
		return new MainThreadExecutor();
	}
	static class MainThreadExecutor implements Executor {
		private final Handler handler = new Handler(Looper.getMainLooper());
		@Override public void execute(Runnable r) {
			handler.post(r);
		}
	}
}
```

所以，此次调用，目的是构建一个用handler封装的Executor，以备后面进行网络请求成功后的线程切换用

3：在代码3处

设置默认CallAdapterFactory

在此添加的CallAdapterFactory属于系统默认的，当然，我们可以添加RxJavaCallAdapterFactory。默认的CallAdapterFactory是 ExecutorCallAdapterFactory 类的对象，在Platform.java Class里面可以梳理出来

```java
defaultCallAdapterFactory(Executor callbackExecutor) {
	return new ExecutorCallAdapterFactory(callbackExecutor);
}
```

所以构建的Retrofit都是用于进行后面请求的需要的内容的一个准备工作。也就是封装Okhttp需要的准备工作。

## 四、Retrofit构建 IxxxService 对象的过程（Retrofit.create()）
看下面的代码：

```java
ISharedListService sharedListService =  retrofit.create(ISharedListService.class);
Call<SharedListBean> sharedListCall = sharedListService.getSharedList(2,1);
```

上面两行代码需要连起来才能正确的被阅读，因为，在create里面是使用了动态代理的技术方案，而动态代理是运行时生效的，create的代码如下：

```java
public <T> T create(final Class<T> service) {
	Utils.validateServiceInterface(service);
	if (validateEagerly) {
		eagerlyValidateMethods(service);
	}
	return (T) Proxy.newProxyInstance(service.getClassLoader(), new Class<?>[] { service },
									  // 通过动态代理的方式生成具体的网络请求实体对象
									  new InvocationHandler() { // 统一处理所有的请求方法
										  private final Platform platform = Platform.get();
										  @Override
										  public Object invoke(Object proxy, Method method, @Nullable Object[] args)
										  throws Throwable {
											  // If the method is a method from Object then defer to normal invocation.
											  if (method.getDeclaringClass() == Object.class) {
												  return method.invoke(this, args);
											  }
											  if (platform.isDefaultMethod(method)) {
												  return platform.invokeDefaultMethod(method, service, proxy, args);
											  }
											  // 根据方法生成一个ServiceMethod对象（内部会将生成的ServiceMethod放入在缓存中，
											  //如果已经生成过则直接从缓存中获取）
											  ServiceMethod<Object, Object> serviceMethod =
											  (ServiceMethod<Object, Object>) loadServiceMethod(method);
											  // 根据ServiceMethod对象和请求参数生成一个OkHttpCall对象，这个OkHttpCall能够
											  //调用OkHttp的接口发起网络请求
											  OkHttpCall<Object> okHttpCall = new OkHttpCall<>(serviceMethod, args);
											  // 调用serviceMethod的callAdapter的adapt方法，并传入okHttpCall，返回一个对象，
											  //这个的目的主要是为了适配返回类型，其内部会对OkhttpCall对象进行包装
											  return serviceMethod.callAdapter.adapt(okHttpCall);
										  }
									  });
}
```

1）Retrofit的create方法通过动态代理的模式，生成了实现了具体的网络请求接口的对象，并在InvocationHandler的invoke方法中统一处理网络请求接口实体对象的方法；

2）invoke方法会通过方法构造一个ServiceMethod对象，并将其放入缓存中；

3）然后根据ServiceMethod对象和网络请求的参数args去构造一个OkHttpCall对象；

4）最后调用serviceMethod的callAdapter的adapt方法，传入将OkHttpCall对象，callAdapter的目的主要是为了适配OkHttpCall对象，其内部会对OkHttpCall对象进行包装，生成对应返回类型的对象。

### 1、1 动态代理
动态代理的原理主要是在运行时动态生成代理类，然后根据代理类生成一个代理对象，在这个代理对象的方法中又调用InvocationHandler的invoke来转发对方法的处理。

那么大家一定要关注一个细节，我们在使用retrofit的时候，对每一个网络请求的产生都必须要先调用create函数，也就是意味着，我们的请求都是通过代理类来进行处理的。但是代理类具体的代理行为是发生在哪里呢？很显然，他并不是在create函数执行的时候，而是在使用具体的接口创建具体网络请求Call的时候，当调用具体网络请求Call的代码示例如下：

```java
Call<SharedListBean> sharedListCall = sharedListService.getSharedList(2,1);
```

在执行上面的代码的时候，它会走代理设计模式的InvocationHandler里面的invoke()函数，也就是所有的网络请求在创建具体网络请求Call的时候，都会走Invoke，从而我们可以在invoke里面进行各种行为的统一处理，比如：接口的统一配置，也就是注解的解读和网络请求参数的拼接。

### 2、2 ServiceMethod
大家先看看loadServiceMethod方法

```java
ServiceMethod loadServiceMethod(Method method) {
ServiceMethod result;
synchronized (serviceMethodCache) {
	// 为什么会缓存?为了效率
	result = serviceMethodCache.get(method);
	if (result == null) {
		result = new ServiceMethod.Builder(this, method).build();
		serviceMethodCache.put(method, result);
	}
}
return result;
}
```

loadServiceMethod首先会从缓存中获取ServiceMethod对象，如果没有，则通过Method和Retrofit对象构造一个ServiceMethod对象，并将其放入缓存中。

[一个细节]

每一个method 都有一个自己的ServiceMethod，这就意味着ServiceMethod是属于函数的，而不是类的。也就是我们定义的网络访问接口类，在接口类里面的每一个函数都会在反射阶段形成自己的serviceMethod。那么ServiceMethod是什么呢？

ServiceMethod其实是用来存储一次网络请求的基本信息的，比如Host、URL、请求方法等，同时ServiceMethod还会存储用来适配OkHttpCall对象的CallAdpater。ServiceMethod的build方法会解读传入的Method，首先ServiceMethod会在CallAdpaterFactory列表中寻找合适的CallAdapter来包装OkHttpCall对象，这一步主要是根据Method的返回参数来匹配的，比如如果方法的返回参数是Call对象，那么ServiceMethod就会使用默认的CallAdpaterFactory来生成CallAdpater，而如果返回对象是RxJava的Obserable对象，则会使用RxJavaCallAdapterFactory提供的CallAdpater。然后build方法会解读Method的注解，来获得注解上配置的网络请求信息，比如请求方法、URL、Header等

```java
public ServiceMethod build() {
	callAdapter = createCallAdapter(); // 查找能够适配返回类型的CallAdpater
	responseType = callAdapter.responseType();
	if (responseType == Response.class || responseType == okhttp3.Response.class) {
		throw methodError("'"
						  + Utils.getRawType(responseType).getName()
						  + "' is not a valid response body type. Did you mean ResponseBody?");
	}
	//设置请求的数据适配器converter
	responseConverter = createResponseConverter();
	// 解读方法的注解
	for (Annotation annotation : methodAnnotations) {
		parseMethodAnnotation(annotation);
	}
	if (httpMethod == null) {
		throw methodError("HTTP method annotation is required (e.g., @GET, @POST, etc.).");
	}
	if (!hasBody) {
		if (isMultipart) {
			throw methodError(
				"Multipart can only be specified on HTTP methods with request body (e.g.,
																					@POST).");
		}
		if (isFormEncoded) {
			throw methodError("FormUrlEncoded can only be specified on HTTP methods with "
							  + "request body (e.g., @POST).");
		}
	}
	int parameterCount = parameterAnnotationsArray.length;
	parameterHandlers = new ParameterHandler<?>[parameterCount];
	for (int p = 0; p < parameterCount; p++) {
		Type parameterType = parameterTypes[p];
		if (Utils.hasUnresolvableType(parameterType)) {
			throw parameterError(p, "Parameter type must not include a type variable or
			wildcard: %s",
			parameterType);
		}
		Annotation[] parameterAnnotations = parameterAnnotationsArray[p];
		if (parameterAnnotations == null) {
			throw parameterError(p, "No Retrofit annotation found.");
		}
		parameterHandlers[p] = parseParameter(p, parameterType, parameterAnnotations);
	}
	if (relativeUrl == null && !gotUrl) {
		throw methodError("Missing either @%s URL or @Url parameter.", httpMethod);
	}
	if (!isFormEncoded && !isMultipart && !hasBody && gotBody) {
		throw methodError("Non-body HTTP method cannot contain @Body.");
	}
	if (isFormEncoded && !gotField) {
		throw methodError("Form-encoded method must contain at least one @Field.");
	}
	if (isMultipart && !gotPart) {
		throw methodError("Multipart method must contain at least one @Part.");
	}
	return new ServiceMethod<>(this);
}
```

### 3、3 okHttpCall
```java
OkHttpCall<Object> okHttpCall = new OkHttpCall<>(serviceMethod, args);
```

我们知道，`ServiceMethod`封装了网络请求的基本信息，比如Host、URL等，我们根据`ServiceMethod`和请求参数args就可以确定本次网络请求的所有信息了，OkHttpCall主要是将这些信息封装起来，并调用OkHttp的接口去发送网络请求，这里，我们就将OkHttpCall看成是一个处理网络请求的类即可。

### 4、4 callAdapter
在retrofit中，invoke() 里面的最后一行代码，

```java
return serviceMethod.callAdapter.adapt(okHttpCall);
```

那么我们可以设想一下为什么Retrofit还要设计一个CallAdapter接口呢？

先来说一个客观事实，Retrofit真正使用Okhttp进行网络请求的就是OkHttpCall这个类曾提到了Call对象的创建是通过是通过ServiceMethod.adapt()完成的，这里在看看该方法的源码：ServiceMethod.adapt()方法：

```java
T adapt(Call<R> call) {
	return callAdapter.adapt(call);
}
```

通过上述源码可知，最终Call对象是调用CallAdapter.adapt(Call)方法创建的，那么CallAdapter及具体的Call对象又是如何生成的呢？

如果没有这个适配器模式，会出现什么情况？

很明显，没有适配器的时候此时我们网络请求的返回接口只能直接返回OkHttpCall，那么所有的网络请求都是用okhttpCall进行，这样的话就失去了retrofit 封装网络请求call的意义了，譬如：rxjavaCallAdapterFactory 就没有办法支持。

如果我们想要返回的不是Call呢？比如RxJava的Observable，这种情况下该 怎么办呢？

适配器模式在此发挥了其应用的作用！！！

将网络请求的核心类OkHttpCall进行适配，你需要什么类型的数据就通过适配器适配，返回适配后的对象就是了。

正是这种CallApdate接口的设计，使得我们在使用Retrofit的时候可以自定义我们想要的返回类型。此接口的设计也为RxJava的扩展使用做了很好的基础！！！

## 五、Retrofit网络请求操作小结
一般的Retrofit网络请求的操作是指 Call.excute() & Call.enqueue()的过程，这个过程才是真正的网络请求，因为，网络配置，请求地址配置，Call适配，网络请求 requestBody &返回值responseBody转化适配准备工作都已经完成。

```java
sharedListCall.enqueue(new Callback()...);
sharedListCall.excute();
```

在进行网络请求的执行的时候，基本上就是调用，ServiceMethod中设置的各个内容如 ：

1）OkHttpCall进行网络请求，实则是进行okhttp的网络请求;

2）利用 converter进行网络请求数据的转换，一般是Gson();

3）利用 rxjava observable构建 rxjava类型的责任链访问方案，并进行线程切换;

4) 如果没有rxjava的添加，那么就使用默认的callAdapter里面的callbackExecutor进行线程的切换

, 进行网络请求.

整体网络请求的流程图请看下图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729684929459-0793c630-a5e9-4d28-83e1-db5d10540c2d.png)

## 六、Retrofit的注解
Retrofit中有很多注解，这些注解总共分三类：HTTP请求方法、标记类、参数类;


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683506030-1ad2cc2a-4ab5-4617-a048-0e333f17ebe2.png)

### 1、第一类：网络请求方法

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683524021-4c51f0d5-7607-4162-a518-6dda43404ce0.png)

GET：对应HTTP的get请求方法

```kotlin
@GET("public")
Call<BaseResult<List<User>>> getUser();
```

POST：对应HTTP的post请求方法

写法：

```kotlin
@POST("User")
Call<BaseResult<String>> addUser();
```

PUT：对应HTTP的put请求方法

写法：

```kotlin
@PUT("User")
Call<BaseResult<String>> updateUser();
```

DELETE：对应HTTP的delete请求方法

写法：

```kotlin
@DELETE("User")
Call<BaseResult<String>> deleteUser();
```

HEAD：对应HTTP的head请求方法

PATCH：对应HTTP的patch请求方法

OPTIONS：对应HTTP的options请求方法

HTTP：可替换以上七种，也可以扩展请求方法

写法：

```kotlin
/
 * method 表示请的方法，不区分大小写
 * path表示路径
 * hasBody表示是否有请求体
*/
@HTTP(method = "get", path = "public", hasBody = false)
Call<BaseResult<List<User>>> getUser();
```

### 2、第二类：标记类注解

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683639128-8a3ac941-d10b-4eb8-8cf1-46a81e539176.png)

Retrofit支持三种标记类注解，分别是：FormUrlEncoded、Multipart、Streaming。

+ FormUrlEncoded：指请求体是一个Form表单，Content-Type=application/x-www-form-urlencoded，需要和参数类注解@Field，@FieldMap搭配使用；

写法：

```kotlin
@FormUrlEncoded
@POST("login")
Flowable<HttpResult<UserInfoData>> login(@FieldMap Map<String, String> map);

@FormUrlEncoded
@POST("public")
Call<BaseResult> addUser(@Field("userName") String userName);

```

+ Multipart：指请求体是一个支持文件上传的Form表单，Content-Type=multipart/form-data，需要和参数类注解@Part，@PartMap搭配使用（详见下节）

写法：

```kotlin
@Multipart
@POST("public")
Call<BaseResult> uploadFile(@Part MultipartBody.Part file);

 @Multipart
@POST("users/image")
Call<BaseResponse<String>> uploadFilesWithParts(@Part() List<MultipartBody.Part> parts);

 @POST("users/image")
Call<BaseResponse<String>> uploadFileWithRequestBody(@Body  MultipartBody multipartBody);
```

使用@Multipart注解方法，并用@Part注解方法参数，类型是List<okhttp3.MultipartBody.Part>

不使用@Multipart注解方法，直接使用@Body注解方法参数，类型是okhttp3.MultipartBody

Streaming：指响应体的数据以流的形式返回，如果不使用默认会把数据全部加载到内存，所以下载文件时需要加上这个注解

写法：

```kotlin
@Streaming
@GET("download")
Call<ResponseBody> downloadFile();
```

```kotlin
public interface GetRequest_Interface {
	/
     *表明是一个表单格式的请求（Content-Type:application/x-www-form-urlencoded）
     * <code>Field("username")</code> 表示将后面的 <code>String name</code> 中name的取值作为 username 的值
     */
	@POST("/form")
	@FormUrlEncoded
	Call<ResponseBody> testFormUrlEncoded1(@Field("username") String name, @Field("age") int age);

	/
	 * {@link Part} 后面支持三种类型，{@link RequestBody}、{@link okhttp3.MultipartBody.Part} 、任意类型
     * 除 {@link okhttp3.MultipartBody.Part} 以外，其它类型都必须带上表单字段({@link okhttp3.MultipartBody.Part} 中已经包含了表单字段的信息)，
     */
	@POST("/form")
	@Multipart
	Call<ResponseBody> testFileUpload1(@Part("name") RequestBody name, @Part("age") RequestBody age, @Part MultipartBody.Part file);

}

```

### 3、第三类：网络请求参数

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683728913-d0c33a8c-5da2-44f9-9a0e-a2b96810b52c.png)

1.@Header & @Headers
添加请求头 &添加不固定的请求头

```java
// @Header
@GET("user")
Call<User> getUser(@Header("Authorization") String authorization)

// @Headers
@Headers("Authorization: authorization")
@GET("user")
Call<User> getUser()

// 以上的效果是一致的。
// 区别在于使用场景和使用方式
// 1. 使用场景：@Header用于添加不固定的请求头，@Headers用于添加固定的请求头
// 2. 使用方式：@Header作用于方法的参数；@Headers作用于方法

```

2.@Body
以 Post方式 传递 自定义数据类型 给服务器,如果提交的是一个Map，那么作用相当于 @Field,不过Map要经过 FormBody.Builder 类处理成为符合 Okhttp 格式的表单，如：

```java
FormBody.Builder builder = new FormBody.Builder();
builder.add("key","value");

```

3.@Field & @FieldMap
发送 Post请求 时提交请求的表单字段,与 @FormUrlEncoded 注解配合使用

```java
public interface GetRequest_Interface {
	/
     *表明是一个表单格式的请求（Content-Type:application/x-www-form-urlencoded）
     * <code>Field("username")</code> 表示将后面的 <code>String name</code> 中name的取值作为 username 的值
     */
	@POST("/form")
	@FormUrlEncoded
	Call<ResponseBody> testFormUrlEncoded1(@Field("username") String name, @Field("age") int age);

	/
     * Map的key作为表单的键
     */
	@POST("/form")
	@FormUrlEncoded
	Call<ResponseBody> testFormUrlEncoded2(@FieldMap Map<String, Object> map);

}

```

4.@Part & @PartMap
发送 Post请求 时提交请求的表单字段,与@Field的区别：功能相同，但携带的参数类型更加丰富，包括数据流，所以适用于 有文件上传 的场景,与 @Multipart 注解配合使用

```java
public interface GetRequest_Interface {

	/
     * {@link Part} 后面支持三种类型，{@link RequestBody}、{@link okhttp3.MultipartBody.Part} 、任意类型
     * 除 {@link okhttp3.MultipartBody.Part} 以外，其它类型都必须带上表单字段({@link okhttp3.MultipartBody.Part} 中已经包含了表单字段的信息)，
     */
	@POST("/form")
	@Multipart
	Call<ResponseBody> testFileUpload1(@Part("name") RequestBody name, @Part("age") RequestBody age, @Part MultipartBody.Part file);

	/
     * PartMap 注解支持一个Map作为参数，支持 {@link RequestBody } 类型，
     * 如果有其它的类型，会被{@link retrofit2.Converter}转换，如后面会介绍的 使用{@link com.google.gson.Gson} 的 {@link retrofit2.converter.gson.GsonRequestBodyConverter}
     * 所以{@link MultipartBody.Part} 就不适用了,所以文件只能用<b> @Part MultipartBody.Part </b>
     */
	@POST("/form")
	@Multipart
	Call<ResponseBody> testFileUpload2(@PartMap Map<String, RequestBody> args, @Part MultipartBody.Part file);

	@POST("/form")
	@Multipart
	Call<ResponseBody> testFileUpload3(@PartMap Map<String, RequestBody> args);
}

```

5.@Query和@QueryMap

用于 @GET 方法的查询参数（Query = Url 中 ‘?’ 后面的 key-value）

如：url = [http://www.println.net/?cate=android](http://www.println.net/?cate=android)，其中，Query = cate

配置时只需要在接口方法中增加一个参数即可：

```java
@GET("/")
Call<String> cate(@Query("cate") String cate);
```

// 其使用方式同 @Field与@FieldMap，这里不作过多描述

6.@Path
URL地址的缺省值

```java
public interface GetRequest_Interface {

	@GET("users/{user}/repos")
	Call<ResponseBody>  getBlog（@Path("user") String user ）;
	// 访问的API是：https://api.github.com/users/{user}/repos
	// 在发起请求时， {user} 会被替换为方法的第一个参数 user（被@Path注解作用）
}

```

7.@Url
直接传入一个请求的 URL变量 用于URL设置

```java
public interface GetRequest_Interface {

	@GET
	Call<ResponseBody> testUrlAndQuery(@Url String url, @Query("showAll") boolean showAll);
	// 当有URL注解时，@GET传入的URL就可以省略
	// 当GET、POST...HTTP等方法中没有设置Url时，则必须使用 {@link Url}提供

}

```

## 七、Retrofit的角色与作用
我们从上面的应用场景可以看出，Retrofit并不做网络请求，只是生成一个能做网络请求的对象。

Retrofit的作用是按照接口去定制Call网络工作对象


什么意思？就是说：

Retrofit不直接做网络请求

Retrofit不直接做网络请求

Retrofit不直接做网络请求

重要的事情说三遍。

网络请求的目标虽然是数据，但是我们需要为这个数据写大量的配套代码，发起请求的对象Call，接收数据的对象CallBack，做数据转换的对象Converter，以及检查和处理异常的对象等。

这对于一个项目的开发、扩展和维护来说，都是成本和风险。

而Retrofit做的事情，就是为开发者节省这部分的工作量，Retrofit一方面从底层统一用OkHttp去做网络处理；另一方面在外层灵活提供能直接融入业务逻辑的Call网络访问对象。

具体来说，Retrofit只负责生产对象，生产能做网络请求的工作对象，他有点像一个工厂，只提供产品，工厂本身不处理网络请求，产品才能处理网络请求。

Retrofit在网络请求中的作用大概可以这样理解：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729683943212-e2232f1a-9e2a-4955-ad73-c1f7a6761d3f.png)

我们看到，从一开始，Retrofit要提供的就是个Call工作对象。
换句话说，对于给Retrofit提供的那个接口

```java
public interface INetApiService {
    @GET("/demobiz/api.php")
    Call<BizEntity> getBizInfo(@Query("id") String id);
}

```

这个接口并不是传统意义上的网络请求接口，这个接口不是用来获取数据的接口，而是用来生产对象的接口，这个接口相当于一个工厂，接口中每个函数的返回值不是网络数据，而是一个能进行网络请求的工作对象，我们要先调用函数获得工作对象，再用这个工作对象去请求网络数据。

所以Retrofit的实用价值意义在于，他能根据你的接口定义，灵活地生成对应的网络工作对象，然后你再择机去调用这个对象访问网络。

