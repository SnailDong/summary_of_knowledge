webview场景使用越来越多，

好用，用户体验效果好

高可靠，webview出了问题不影响主线程

可扩展，html页面不是经常和native通信，增加功能时方便

满足activity+fragment的需求

构建webview项目架构从四化入手：模块化、层次化、组件化、控件化，如下架构示意图所示

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726890847314-3d483ed6-00f8-496d-9757-0c603fa4dfe7.jpeg)

创建一个app，启动MainActivity运行app

创建一个webview模块，创建WebViewActivity包裹webview，通过MainActivity的button启动WebViewActivity并跳转到url的页面

创建一个common模块，定义IWebViewService接口用于app模块使用，同时在webview模块中WebViewServiceImpl实现IWebViewService的接口，在WebViewServiceImpl调用启动页面，创建实例、传值的操作。

创建base模块，创建autoservice代码，加载IWebViewService的实现类并调用对应方法

将activity+webview的结构换成activity+fragment+webview的结构，创建WebViewFragment代码，并修改代码逻辑通过编译运行

基本的activity+fragment+webview实现，但是加载页面是有白屏闪过，实现过渡的加载loading，导入loadsir和lottie开源库，并创建application初始化，

创建WebVIewCallBack和MyWebViewClient并实现loading和加载失败显示失败页的功能（WebViewClient关注的是页面，主要是页面的变化）

想要拿到页面的标题并显示在上方，创建MyWebViewChromeClient并实现功能（WebChromeChient关注的是浏览器内核，可以拿到页面内的标题等信息）

在webview的模块中将webview的WebSetting独立出来创建一个webSetting管理类，专门去对webview的设置进行统一管理


webview很复杂，要支持从90年代就已经能显示的html,很容易出现崩溃，又因为代码量不少，使用的内存也不少，所以要放到独立的进程中，奔溃后不影响app的运行。

多进程很多app都在使用，比如微信、微博等，微信打开时用到了几个进程，打开小程序又需要使用几个进程，包括车载中hicar使用时也需要用到三四个进程等。

只需要在webview模块的manifest中添加`android:process=":webview"`，主进程是原来的app的进程，其他进程是以app进车给加:模块，独立的进程必须用activity和service，因为manifest里使用四大组件。


![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1727074888103-9b9f76d2-464d-45b6-a70b-2ec9068b5683.jpeg)

在webview中编写js和html代码，并在webview中声明@JavascriptInterface的接口实现html的动作传递到webview，简单实现一个toast功能。

虽然可以在webview中实现toast功能，但是webview是一个组件，不应该有很多主进程的功能，应尽量少的做修改，提供接口给到主进程，在主线程中实现该功能。


## 一、Android的Autoservice的使用以及隐藏的天坑
### 1、使用流程
1. 添加依赖

```java
implementation ‘com.google.auto.service:auto-service:1.0-rc7’
```

2. 创建下沉服务接口

```java
interface IWebViewService {
	fun funtest()
}
```

3. 创建服务实现

```java
@AutoService({IService::class})
class WebViewServiceImpl : IWebViewService {
	override funtest() {
		// TODO
		dosomething()
	}
}
```

4. 服务实现

```java
IWebViewService webviewService = ServiceLoader.load(IWebViewService.class).iterator().next();
```

这里使用ServiceLoader.load(MyService.class)来加载MyService的所有实现，然后遍历这些实现并调用它们的方法。

### 2、使用报错
```java
java.util.NoSuchElementException
at java.util.ServiceLoader$LazyIterator.nextService(ServiceLoader.java:366)
at java.util.ServiceLoader$LazyIterator.next(ServiceLoader.java:416)
at java.util.ServiceLoader$1.next(ServiceLoader.java:494)
```

在iterator.next()一直返回null，解决方法如下：

在1步骤添加依赖中增加

java中`annotationProcessor 'com.google.auto.service:auto-service:1.0-rc7'`或者kotlin使用

`kapt 'com.google.auto.service:auto-service:1.0-rc6'`，重新编译即可，kapt就相当于annotationProcessor。

或者直接将服务接口的实现类改成java实现。


## 二、无法引入GitHub三方库
在使用Android Studio新建项目时遇到引入GitHub三方库报错，原因是无法下载github上的第三方开源库。

解决方法：
settings.gradle默认是这样的

```java
dependencyResolutionManagement {
	repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
	repositories {
		google()
		mavenCentral()
	}
}
rootProject.name = "My App"
include ':app'
```

添加国内镜像。

```java
dependencyResolutionManagement {
	repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
	repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
	repositories {
	maven {
		allowInsecureProtocol = true
		url 'http://maven.aliyun.com/nexus/content/groups/public/'
		}
	maven {
	allowInsecureProtocol = true
	url 'https://maven.aliyun.com/repository/google'
}
maven {
allowInsecureProtocol = true
url 'https://maven.aliyun.com/repository/public'
}
maven {
allowInsecureProtocol = true
url 'https://maven.aliyun.com/repository/jcenter'
}
maven {
allowInsecureProtocol = true
url 'https://maven.aliyun.com/repository/gradle-plugin'
}
maven {
allowInsecureProtocol = true
url 'https://maven.aliyun.com/repository/central'
}
maven {
allowInsecureProtocol = true
url 'http://maven.aliyun.com/nexus/content/groups/public/'
}
maven {
allowInsecureProtocol = true
url 'http://maven.aliyun.com/nexus/content/repositories/jcenter'
}
google()
mavenCentral()
maven {
allowInsecureProtocol = true
url 'https://nexus-iov.desaysv.com/repository/android-public/'
}
}
}
rootProject.name = "My App"
include ':app'
```

## 三、依赖冲突问题
```java
: ����: �޷�����NestedScrollingParent mBinding.smartrefreshlayout.setOnRefreshListener(this); ^ �Ҳ���android.support.v4.view.NestedScrollingParent�����ļ�
```

解决方法

使用Jetifier来桥接旧的支持库和新的AndroidX库。可以在项目的`gradle.properties`文件中添加`android.enableJetifier=true`来启用Jetifier

