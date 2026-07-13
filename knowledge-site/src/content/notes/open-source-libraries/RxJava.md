> 入门相关资料：
>
> [RxJava2.0——从放弃到入门](https://www.jianshu.com/p/cd3557b1a474)
>
> [RxJava篇（应用场景）](https://www.jianshu.com/p/14e836885d9e)
>
> [RxJava入门之路（一） - 向着大牛奋斗 - 博客园](https://www.cnblogs.com/lyysz/p/6344507.html)
>
> [【知识整理】这可能是最好的RxJava 2.x 入门教程（一） - 南尘 - 博客园](https://www.cnblogs.com/liushilin/p/7058302.html)
>
> [RxJava入门之介绍与基本运用_Android_脚本之家](https://www.jb51.net/article/92309.htm)
>
> [RxJava入门](https://zhuanlan.zhihu.com/p/31413825)
>

## 一、RxJava应用场景
### 1、1 核心思想
在我们开发中，假如我们需要下载一张图片，并且显示出来，可以有多种方法：

A思维：new Thread+Handler实现

B思维：AsynTask实现

C思维：其他方式实现。

每种思维下的代码都不一样，这样就会造成下载图片的一个功能，每个人都有自己的编码方式，不统一。

RxJava的思想就是基于起点到终点的一个模式，在起点中输入一个事件，终点输出我们想要的结果。在起点和终点之间可能会有多个拦截加工对事件的处理，但是目的都是为了在终点输出我们想要的结果。起点和终点的线路不会断。

#### (1) 传统思维下载图片
思维A的实现

```java
public void downloadImageAction(View view) {
	progressDialog = new ProgressDialog(this);
	progressDialog.setTitle("下载图片中...");
	progressDialog.show();

	new Thread(new Runnable() {
		@Override
		public void run() {
			try {
				URL url = new URL(PATH);
				HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
				httpURLConnection.setConnectTimeout(5000);
				int responseCode = httpURLConnection.getResponseCode(); // 才开始 request
				if (responseCode == HttpURLConnection.HTTP_OK) {
					InputStream inputStream = httpURLConnection.getInputStream();
					Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
					Message message = handler.obtainMessage();
					message.obj = bitmap;
					handler.sendMessage(message);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}).start();
}

private final Handler handler = new Handler(new Handler.Callback() {

	@Override
	public boolean handleMessage(@NonNull Message msg) {
		Bitmap bitmap = (Bitmap) msg.obj;
		image.setImageBitmap(bitmap);

		if (progressDialog != null) progressDialog.dismiss();
		return false;
	}
});
```

#### (2) RxJava思维下载图片
下面我们通过RxJava来实现一个下载图片的功能：

```java
String path = "http://39.108.14.94:9007/donghui_oa/IMG/20210103041020962378.jpg";
private void test1() {
	//1、输入一个事件path
	Observable.just(path)
	//2、对事件加工
	.map(new Function<String, Bitmap>() {
		@Override
		public Bitmap apply(@NonNull String s) throws Exception {
			URL url = new URL(path);
			HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
			httpURLConnection.setConnectTimeout(16000);
			int code = httpURLConnection.getResponseCode();
			if (code == HttpURLConnection.HTTP_OK) {
				InputStream inputStream = httpURLConnection.getInputStream();
				Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
				return bitmap;
			}
			return null;
		}
	})
	.subscribeOn(Schedulers.io())
	.observeOn(AndroidSchedulers.mainThread())
	//3、订阅
	.subscribe(new Observer<Bitmap>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {
			Log.e(TAG, "onSubscribe: " );
		}
		//4、输出事件
		@Override
		public void onNext(@NonNull Bitmap bitmap) {
			Log.e(TAG, "onNext: " );
			image.setImageBitmap(bitmap);
		}

		@Override
		public void onError(@NonNull Throwable e) {
			Log.e(TAG, "e: "+e );
		}

		@Override
		public void onComplete() {
			Log.e(TAG, "onComplete: " );
		}
	});
}

```

起点我们输入一个path事件，接着对事件进行加工即通过path下载网络图片，然后将事件类型转换成bitmap。我们的终点接受上一道加工程序的事件bitmap。最后拿到结果显示我们的图片。

在使用rxjava时我们用到Observable还有just、map等操作符后面我们会讲解，这里暂时只关注整体的流程和思想。

### 2、2 RxJava配合Retrofit
之前我们在讲解retrofit的时候说过，流行的框架rxjava+retrofit+okhttp。

那么在RxJava配合Retrofit的使用中，Retrofit负责去请求网络拿到数据，并且将拿到的数据封装成一个起点。接着通过RxJava反射数据将起点事件传递到终点。

+ 例子

（1）封装一个下载图片的Api

```java
package com.example.andoiddemo;


import io.reactivex.Observable;
import okhttp3.ResponseBody;
import retrofit2.http.GET;
import retrofit2.http.Streaming;

public interface Api {
    @GET("IMG/20210103041020962378.jpg")
    @Streaming
    Observable<ResponseBody> downLoad();

}
```

（2）封装Retrofit

```java
package com.example.andoiddemo;

import android.util.Log;

import com.facebook.stetho.okhttp3.StethoInterceptor;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.adapter.rxjava2.RxJava2CallAdapterFactory;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitUtil {
    final static String baseUrl = "http://39.108.14.94:9007/donghui_oa/";
     static OkHttpClient okHttpClient = new OkHttpClient.Builder()

            .addInterceptor(new HttpLoggingInterceptor(new HttpLoggingInterceptor.Logger() {
                @Override
                public void log(String message) {   //访问网络请求，和服务端响应请求时。将数据拦截并输出
                    Log.e("RetrofitUtil", "log: " + message);
                }
            }).setLevel(HttpLoggingInterceptor.Level.BODY))     //Log等级
            .connectTimeout(16 ,TimeUnit.SECONDS)       //超时时间
            .readTimeout(16, TimeUnit.SECONDS)
            .writeTimeout(16, TimeUnit.SECONDS)
            .addNetworkInterceptor(new StethoInterceptor())

            .build();
    static Retrofit retrofit = new Retrofit
            .Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
            .addConverterFactory(GsonConverterFactory.create()).build();

    public static Retrofit getInstance() {
        return retrofit;
    }

}
```

（3）下载图片

```java
//下载图片
private void test2() {
	//1、起点
	Observable<ResponseBody> bodyObservable = RetrofitUtil.getInstance().create(Api.class).downLoad();
	//2、起点发送事件
	bodyObservable.
	subscribeOn(Schedulers.io())
	.observeOn(AndroidSchedulers.mainThread())
	//3、转换事件类型
	.map(new Function<ResponseBody, Bitmap>() {
		@Override
		public Bitmap apply(@NonNull ResponseBody responseBody) throws Exception {
			Bitmap bitmap = BitmapFactory.decodeStream(responseBody.byteStream());
			return bitmap;
		}
	})
	//4、订阅
	.subscribe(new Observer<Bitmap>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {
			Log.e(TAG, "onSubscribe: ");
		}
		//5、接受事件
		@Override
		public void onNext(@NonNull Bitmap bitmap) {
			Log.e(TAG, "onNext: " + bitmap);
			image.setImageBitmap(bitmap);
		}

		@Override
		public void onError(@NonNull Throwable e) {
			Log.e(TAG, "onError: " + e);
		}

		@Override
		public void onComplete() {
			Log.e(TAG, "onComplete: ");
		}
	});
}
```

在Retrofit中支持添加一个addCallAdapterFactory为RxJava2CallAdapterFactory，即我们定义API的时候可以定义返回RxJava的数据类型， Observable<ResponseBody>这个即是我们在RxJava中说的起点。
接着订阅Observable<ResponseBody>起点发射数据，并转换数据成Bitmap。最后终点接受我们的Bitmap，拿到最后结果。显示图片。

### 3、3 防抖
在RxJava中封装了一系列的库，其中包含了对View操作的rxbinding。我们演示一个开发中经常遇到的例子，就是一个View在某个时间段内快速点击了很多次，我们只响应一次。

设置1s内只响应一次。

```java
private void test3() {
	RxView.clicks(tvDown).throttleFirst(1000, TimeUnit.MILLISECONDS).subscribe(new Observer<Object>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {

		}

		@Override
		public void onNext(@NonNull Object o) {
			Log.e(TAG, "onNext: 响应事件....." );
		}

		@Override
		public void onError(@NonNull Throwable e) {

		}

		@Override
		public void onComplete() {

		}
	});

}
```

### 4、4 网络嵌套
在我们开发中经常会有这种需求，就是我们的业务是需要调用某个接口，然后拿到某个接口的数据再去调用某个接口，这样是一个嵌套的网络请求。当然还有可能嵌套很多层。就会给我们开发造成了比较大的麻烦。我们通过使用RxJava来实现一个网络嵌套请求。
我们的业务是通过查询一个分类列表接口，然后再通过分类里面的ID 再查询分类下的集合。

+ 定义API

```java
/
 * 查询分类数据
 * @return
 */
@GET("project/tree/json")
Observable<ProjectData> getProjectData();

/
 * 根据分类查询列表数据
 * @param page
 * @param cid
 * @return
 */
@GET("project/list/{page}/json?cid=294")
Observable<ItemData> getItemData(@Path("page") String page, @Query("cid") Integer cid)
```

+ 封装Retrofit

```java
package com.example.andoiddemo;

import android.util.Log;

import com.facebook.stetho.okhttp3.StethoInterceptor;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.adapter.rxjava2.RxJava2CallAdapterFactory;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitUtil {
	final static String baseUrl = "https://www.wanandroid.com/";
	static OkHttpClient okHttpClient = new OkHttpClient.Builder()

	.addInterceptor(new HttpLoggingInterceptor(new HttpLoggingInterceptor.Logger() {
		@Override
		public void log(String message) {   //访问网络请求，和服务端响应请求时。将数据拦截并输出
			Log.e("RetrofitUtil", "log: " + message);
		}
	}).setLevel(HttpLoggingInterceptor.Level.BODY))     //Log等级
	.connectTimeout(16 ,TimeUnit.SECONDS)       //超时时间
	.readTimeout(16, TimeUnit.SECONDS)
	.writeTimeout(16, TimeUnit.SECONDS)
	.addNetworkInterceptor(new StethoInterceptor())

	.build();
	static Retrofit retrofit = new Retrofit
	.Builder()
	.baseUrl(baseUrl)
	.client(okHttpClient)
	.addCallAdapterFactory(RxJava2CallAdapterFactory.create())
	.addConverterFactory(GsonConverterFactory.create()).build();

	public static Retrofit getInstance() {
		return retrofit;
	}

}
```

+ 封装实体数据

```java
package com.example.andoiddemo;

import java.util.List;

public class ProjectData {
	private List<Data> data;

	private int errorCode;

	private String errorMsg;

	public void setData(List<Data> data) {
		this.data = data;
	}

	public List<Data> getData() {
		return this.data;
	}

	public void setErrorCode(int errorCode) {
		this.errorCode = errorCode;
	}

	public int getErrorCode() {
		return this.errorCode;
	}

	public void setErrorMsg(String errorMsg) {
		this.errorMsg = errorMsg;
	}

	public String getErrorMsg() {
		return this.errorMsg;
	}

	static class Data {
		private int courseId;

		private int id;

		private String name;

		private int order;

		private int parentChapterId;

		private boolean userControlSetTop;

		private int visible;


		public void setCourseId(int courseId) {
			this.courseId = courseId;
		}

		public int getCourseId() {
			return this.courseId;
		}

		public void setId(int id) {
			this.id = id;
		}

		public int getId() {
			return this.id;
		}

		public void setName(String name) {
			this.name = name;
		}

		public String getName() {
			return this.name;
		}

		public void setOrder(int order) {
			this.order = order;
		}

		public int getOrder() {
			return this.order;
		}

		public void setParentChapterId(int parentChapterId) {
			this.parentChapterId = parentChapterId;
		}

		public int getParentChapterId() {
			return this.parentChapterId;
		}

		public void setUserControlSetTop(boolean userControlSetTop) {
			this.userControlSetTop = userControlSetTop;
		}

		public boolean getUserControlSetTop() {
			return this.userControlSetTop;
		}

		public void setVisible(int visible) {
			this.visible = visible;
		}

		public int getVisible() {
			return this.visible;
		}

	}


}
```

```java
package com.example.andoiddemo;

import java.util.List;

public class ItemData {
    private Data data;

    private int errorCode;

    private String errorMsg;

    public void setData(Data data) {
        this.data = data;
    }

    public Data getData() {
        return this.data;
    }

    public void setErrorCode(int errorCode) {
        this.errorCode = errorCode;
    }

    public int getErrorCode() {
        return this.errorCode;
    }

    public void setErrorMsg(String errorMsg) {
        this.errorMsg = errorMsg;
    }

    public String getErrorMsg() {
        return this.errorMsg;
    }


    static class Datas {
        private String apkLink;

        private int audit;

        private String author;

        private boolean canEdit;

        private int chapterId;

        private String chapterName;

        private boolean collect;

        private int courseId;

        private String desc;

        private String descMd;

        private String envelopePic;

        private boolean fresh;

        private String host;

        private int id;

        private String link;

        private String niceDate;

        private String niceShareDate;

        private String origin;

        private String prefix;

        private String projectLink;

        private String publishTime;

        private String realSuperChapterId;

        private String selfVisible;

        private String shareDate;

        private String shareUser;

        private String superChapterId;

        private String superChapterName;


        private String title;

        private int type;

        private int userId;

        private int visible;

        private int zan;

        public String getApkLink() {
            return apkLink;
        }

        public void setApkLink(String apkLink) {
            this.apkLink = apkLink;
        }

        public int getAudit() {
            return audit;
        }

        public void setAudit(int audit) {
            this.audit = audit;
        }

        public String getAuthor() {
            return author;
        }

        public void setAuthor(String author) {
            this.author = author;
        }

        public boolean isCanEdit() {
            return canEdit;
        }

        public void setCanEdit(boolean canEdit) {
            this.canEdit = canEdit;
        }

        public int getChapterId() {
            return chapterId;
        }

        public void setChapterId(int chapterId) {
            this.chapterId = chapterId;
        }

        public String getChapterName() {
            return chapterName;
        }

        public void setChapterName(String chapterName) {
            this.chapterName = chapterName;
        }

        public boolean isCollect() {
            return collect;
        }

        public void setCollect(boolean collect) {
            this.collect = collect;
        }

        public int getCourseId() {
            return courseId;
        }

        public void setCourseId(int courseId) {
            this.courseId = courseId;
        }

        public String getDesc() {
            return desc;
        }

        public void setDesc(String desc) {
            this.desc = desc;
        }

        public String getDescMd() {
            return descMd;
        }

        public void setDescMd(String descMd) {
            this.descMd = descMd;
        }

        public String getEnvelopePic() {
            return envelopePic;
        }

        public void setEnvelopePic(String envelopePic) {
            this.envelopePic = envelopePic;
        }

        public boolean isFresh() {
            return fresh;
        }

        public void setFresh(boolean fresh) {
            this.fresh = fresh;
        }

        public String getHost() {
            return host;
        }

        public void setHost(String host) {
            this.host = host;
        }

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public String getLink() {
            return link;
        }

        public void setLink(String link) {
            this.link = link;
        }

        public String getNiceDate() {
            return niceDate;
        }

        public void setNiceDate(String niceDate) {
            this.niceDate = niceDate;
        }

        public String getNiceShareDate() {
            return niceShareDate;
        }

        public void setNiceShareDate(String niceShareDate) {
            this.niceShareDate = niceShareDate;
        }

        public String getOrigin() {
            return origin;
        }

        public void setOrigin(String origin) {
            this.origin = origin;
        }

        public String getPrefix() {
            return prefix;
        }

        public void setPrefix(String prefix) {
            this.prefix = prefix;
        }

        public String getProjectLink() {
            return projectLink;
        }

        public void setProjectLink(String projectLink) {
            this.projectLink = projectLink;
        }

        public String getPublishTime() {
            return publishTime;
        }

        public void setPublishTime(String publishTime) {
            this.publishTime = publishTime;
        }

        public String getRealSuperChapterId() {
            return realSuperChapterId;
        }

        public void setRealSuperChapterId(String realSuperChapterId) {
            this.realSuperChapterId = realSuperChapterId;
        }

        public String getSelfVisible() {
            return selfVisible;
        }

        public void setSelfVisible(String selfVisible) {
            this.selfVisible = selfVisible;
        }

        public String getShareDate() {
            return shareDate;
        }

        public void setShareDate(String shareDate) {
            this.shareDate = shareDate;
        }

        public String getShareUser() {
            return shareUser;
        }

        public void setShareUser(String shareUser) {
            this.shareUser = shareUser;
        }

        public String getSuperChapterId() {
            return superChapterId;
        }

        public void setSuperChapterId(String superChapterId) {
            this.superChapterId = superChapterId;
        }

        public String getSuperChapterName() {
            return superChapterName;
        }

        public void setSuperChapterName(String superChapterName) {
            this.superChapterName = superChapterName;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public int getType() {
            return type;
        }

        public void setType(int type) {
            this.type = type;
        }

        public int getUserId() {
            return userId;
        }

        public void setUserId(int userId) {
            this.userId = userId;
        }

        public int getVisible() {
            return visible;
        }

        public void setVisible(int visible) {
            this.visible = visible;
        }

        public int getZan() {
            return zan;
        }

        public void setZan(int zan) {
            this.zan = zan;
        }
    }

    static class Data {
        private int curPage;

        private List<Datas> datas;

        private int offset;

        private boolean over;

        private int pageCount;

        private int size;

        private int total;

        public void setCurPage(int curPage) {
            this.curPage = curPage;
        }

        public int getCurPage() {
            return this.curPage;
        }

        public void setDatas(List<Datas> datas) {
            this.datas = datas;
        }

        public List<Datas> getDatas() {
            return this.datas;
        }

        public void setOffset(int offset) {
            this.offset = offset;
        }

        public int getOffset() {
            return this.offset;
        }

        public void setOver(boolean over) {
            this.over = over;
        }

        public boolean getOver() {
            return this.over;
        }

        public void setPageCount(int pageCount) {
            this.pageCount = pageCount;
        }

        public int getPageCount() {
            return this.pageCount;
        }

        public void setSize(int size) {
            this.size = size;
        }

        public int getSize() {
            return this.size;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public int getTotal() {
            return this.total;
        }

    }

}
```

+ 使用RxJava实现网络嵌套请求

```java
/
     * 查询分类的列表，
     * 再根据分类id查询分类下的集合
     */
private void test4() {
	RetrofitUtil.getInstance().create(Api.class).getProjectData()
	.flatMap(new Function<ProjectData, ObservableSource<ProjectData.Data>>() {
		@Override
		public ObservableSource<ProjectData.Data> apply(@NonNull ProjectData projectData) throws Exception {
			return Observable.fromIterable(projectData.getData());
		}
	})
	.flatMap(new Function<ProjectData.Data, ObservableSource<ItemData>>() {
		@Override
		public ObservableSource<ItemData> apply(@NonNull ProjectData.Data data) throws Exception {
			return RetrofitUtil.getInstance().create(Api.class).getItemData("1", data.getId());
		}

	})
	.subscribeOn(Schedulers.io())
	.observeOn(AndroidSchedulers.mainThread())
	.subscribe(new Observer<ItemData>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {
			Log.e(TAG, "onSubscribe: ");
		}

		@Override
		public void onNext(@NonNull ItemData itemData) {
			Log.e(TAG, "onNext: "+itemData.getData().getDatas() );
		}

		@Override
		public void onError(@NonNull Throwable e) {
			Log.e(TAG, "onError: "+e);
		}

		@Override
		public void onComplete() {
			Log.e(TAG, "onComplete: ");
		}
	});
}
```

### 5、5 doOnNext运用
doOnNext操作符，允许我们从起点发射事件到终点期间对事件做一些额外的处理，然后继续发射。例如我们发射一个长度为3的集合，在发射期间，我们先对这个集合做一个校验，然后继续发射。

```java
private void test6() {
	List<String> list = new ArrayList<>();
	list.add("1");
	list.add("2");
	list.add("3");

	Observable.just(list)
	.doOnNext(new Consumer<List<String>>() {
		@Override
		public void accept(List<String> strings) throws Exception {
			check(list);
		}
	}).flatMap(new Function<List<String>, ObservableSource<String>>() {
		@Override
		public ObservableSource<String> apply(@NonNull List<String> strings) throws Exception {
			return Observable.fromIterable(strings);
		}
	}).subscribe(new Observer<String>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {

		}

		@Override
		public void onNext(@NonNull String s) {
			Log.e(TAG, "onNext: "+s );
		}

		@Override
		public void onError(@NonNull Throwable e) {
			Log.e(TAG, "onError: "+e);
		}

		@Override
		public void onComplete() {

		}
	});

}

private void check(List<String> list) {
	list.remove(0);
}
```

```java
2021-06-08 16:49:21.485 26310-26310/com.example.andoiddemo E/MainActivity: onNext: 2
2021-06-08 16:49:21.485 26310-26310/com.example.andoiddemo E/MainActivity: onNext: 3
```

## 二、RxJava模式与原理
之前我们说 RxJava是基于起点到终点，之间通过一条线连接，这条线里我们可以做相应的拦截操作的这种编程思维。其实在规范的称呼中RxJava是基于观察者设计模式的一种响应式编程思维。从RxJava两个关键对象就可以看到Observable是我们的被观察者、Observer是我们的观察者。Observer通过观察Observable的数据变换做出响应，然而又说RxJava使用的不是标准的观察者设计模式。


### 1、标准观察者与RxJava观察者
#### (1) 观察者设计模式
什么是观察者设计模式？
如下图，我们有一个微信公众号，公众号可以定时更新文章并推送给关注的用户。A和B用户关注了公众号，当公众号更新文章的时候A和B收到了相应的推送。在这里我们的公众号就是一个被观察者，A和B用户就是观察者。当公众号更新消息推送的时候，A和B就可以通过观察收到消息。


![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1730287284548-1f906cf0-712a-444f-a6ba-b57075abe627.webp)

通过代码实现

+ 创建被观察者

```java
package com.example.andoiddemo;

/
 * 被观察者接口
 */
public interface Observable {
    void addUser(Observer user);

    void removeUser(Observer user);

    void pushMessage(String msg);
}
```

```java
package com.example.andoiddemo;


import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class WeChatObservable implements Observable {
    private static final String TAG ="WeChatObservable" ;
    private List<Observer> list = new ArrayList<>();
    @Override
    public void addUser(Observer user) {
        list.add(user);
    }
    @Override
    public void removeUser(Observer user) {
        list.remove(user);
    }

    @Override
    public void pushMessage(String msg) {
        Log.e(TAG, "观察者推送了一条消息: "+msg );
        for (int i = 0; i <list.size() ; i++) {
            list.get(i).receiveMessage(msg);
        }
    }
}
```

+ 创建观察者A和B

```java
package com.example.andoiddemo;

/
 * 观察者
 */
public interface Observer {


    /
     * 收到消息
     * @param msg
     */
    void receiveMessage(String msg);
}
```

```java
package com.example.andoiddemo;

import android.util.Log;

public class AUserObserver implements Observer {
    private static final String TAG = "AUserObserver";

    @Override
    public void receiveMessage(String msg) {
        Log.e(TAG, "A用户收到了消息: "+msg );
    }
}
```

```java
package com.example.andoiddemo;

import android.util.Log;

public class BUserObserver implements Observer {
    private static final String TAG = "BUserObserver";

    @Override
    public void receiveMessage(String msg) {
        Log.e(TAG, "B用户收到了消息: "+msg );
    }
}
```

+ 测试

```java
private void test7() {
	com.example.andoiddemo.Observer a = new com.example.andoiddemo.AUserObserver();
	com.example.andoiddemo.Observer b = new com.example.andoiddemo.BUserObserver();
	com.example.andoiddemo.Observable observable = new WeChatObservable();
	//添加关注
	observable.addUser(a);
	observable.addUser(b);
	observable.pushMessage("hello world");
	//移除关注
	observable.removeUser(b);
	observable.pushMessage("你好世界");
}
```

```java
2021-06-08 18:00:39.229 25088-25088/com.example.andoiddemo E/WeChatObservable: 观察者推送了一条消息: hello world
2021-06-08 18:00:39.229 25088-25088/com.example.andoiddemo E/AUserObserver: A用户收到了消息: hello world
2021-06-08 18:00:39.229 25088-25088/com.example.andoiddemo E/BUserObserver: B用户收到了消息: hello world
2021-06-08 18:00:39.229 25088-25088/com.example.andoiddemo E/WeChatObservable: 观察者推送了一条消息: 你好世界
2021-06-08 18:00:39.229 25088-25088/com.example.andoiddemo E/AUserObserver: A用户收到了消息: 你好世界
```

通过以上的代码我们发现，观察者设计模式的核心就是被观察者对象中有一个容器，这个容器包含了观察者对象。当观察者数据更新的时候，再通过容器中拿到被观察者对象然后通知他们，这样一来观察者就收到了数据更新。再标准的观察者设计模式中，这里被观察者只有一个，观察者可以有多个。

#### (2) 观察者设计模式与RxJava对比
以上我们知道在标准的观察者设计模式中，被观察者只有一个，而观察者可以有多个。而我们再来看看RxJava的代码。

```java
private void test8() {
	Observable.just("hello world").map(new Function<String, String>() {
		@Override
		public String apply(@NonNull String s) throws Exception {
			return s;
		}
	}).map(new Function<String, String>() {
		@Override
		public String apply(@NonNull String s) throws Exception {
			return s;
		}
	}).map(new Function<String, String>() {
		@Override
		public String apply(@NonNull String s) throws Exception {
			return s;
		}
	}).subscribe(new Observer<String>() {
		@Override
		public void onSubscribe(@NonNull Disposable d) {

		}

		@Override
		public void onNext(@NonNull String s) {
			Log.e(TAG, "onNext: "+s );
		}

		@Override
		public void onError(@NonNull Throwable e) {

		}

		@Override
		public void onComplete() {

		}
	});
}
```

在test8的方法中我们看到Observable被观察者通过just输入一个事件，然后调用了3次map，每一次map操作都返回一个被观察者，这样就将事件依次变换传递给下面的被观察者。而我们的观察者要接收事件做出响应，必须要通过subscribe进行订阅，并且观察者响应的是最后一个被观察者的事件。这里就和标准的观察者模式有所区别。

+ 标准的观察者模式，被观察者只有一个，观察者可以有多个，当被观察者发出事件的时候，所有添加的观察者都能收到事件。
+ RxJava中的观察者设计模式，也称为发布订阅模式，被观察者可以有多个，观察者只有一个，两者之间通过订阅进行关联。并且观察者只接受最后一个被观察者的事件。

#### (3) RxJava中的Hook机制
```java
Observable.create(new ObservableOnSubscribe<Object>() {
	@Override
	public void subscribe(ObservableEmitter<Object> e) throws Exception {
		e.onNext("A");
	}
})

// null.map
.map(new Function<Object, Boolean>() {
	@Override
	public Boolean apply(Object o) throws Exception {
		return true;
	}
})

.subscribe(new Consumer<Boolean>() {
	@Override
	public void accept(Boolean aBoolean) throws Exception {

	}
})   ;
}
```

```java
public static <T> Observable<T> create(ObservableOnSubscribe<T> source) {
	ObjectHelper.requireNonNull(source, "source is null");
	return RxJavaPlugins.onAssembly(new ObservableCreate<T>(source));
}
public final <R> Observable<R> map(Function<? super T, ? extends R> mapper) {
	ObjectHelper.requireNonNull(mapper, "mapper is null");
	return RxJavaPlugins.onAssembly(new ObservableMap<T, R>(this, mapper));
}
```

当我们执行create、map等操作符时，会发现源码中会用到onAssembly函数，如下代码，该接口里当`f==null`时就是将参数原封不动的返回，只有当`f!=null`时才返回处理的结果，onAssembly就是rxjava中的一个hook，

```java
public static <T> Observable<T> onAssembly(@NonNull Observable<T> source) {
	Function<? super Observable, ? extends Observable> f = onObservableAssembly;
	if (f != null) {
		return apply(f, source);
	}
	return source;
}
```

如下，可以看到`onObservableAssembly`只有一处地方可以设置，所以想要使用这个hook，就必须自己去调用setOnObservableAssembly去设置，并且`onObservableAssembly`是一个全局静态变量，如果设置了的话会对每一处使用到的地方产生影响。

```java
static volatile Function<? super Observable, ? extends Observable> onObservableAssembly;
public static void setOnObservableAssembly(@Nullable Function<? super Observable, ? extends Observable> onObservableAssembly) {
	if (lockdown) {
		throw new IllegalStateException("Plugins can't be changed anymore");
	}
	RxJavaPlugins.onObservableAssembly = onObservableAssembly;
}
```

如下代码，我们设置了Hook，并且在apply中做了一系列处理，并返回原来的值observable，即做了处理并且不破坏原来的功能，而如果我们如注释中当observable是ObservableMap时返回null的话，`.map`的结果就会为null,程序运行执行到`.subscribe`会报空指针异常。

```java
RxJavaPlugins.setOnObservableAssembly(new Function<Observable, Observable>() {
	@Override
	public Observable apply(Observable observable) throws Exception {
		Log.d(Flag.TAG, "apply: 整个项目 全局 监听 到底有多少地方使用 RxJava:" + observable);

		// 伪代码
		/*if (observable  === ObservableMap)
                    return null;*/

		return observable; // 不破坏人家的功能
	}
});
```

Hook的机制和思想就是在A---B---C的过程中，在执行B前抽离代码做处理并把处理的代码再放回原处继续执行B，处理的过程是正对所有使用Hook的地方，有可能改变原来的结果产生异常，也有可能不影响。

### 2、RxJava事件发射以及map事件变换原理
#### (1) 事件发射

![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1730287487165-c5603f2a-b481-44d7-9d2f-28c611ecd311.webp)

#### (2) map事件变换

![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1730287495988-0eac1cbf-2019-4f7c-8475-6e11ab674573.webp)

## 三、RxJava原理与自定义操作符
### 1、线程切换原理
#### (1) subscribeOn(Schedulers.io())
将当前运行环境切换到Io线程，其实就子线程。原理就是将我们observer封装成runnable对象，由线程池执行。


![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1730287528296-c961aa4d-4805-474f-944b-8f89f3d9b9a6.webp)

#### (2) observeOn(AndroidSchedulers.mainThread())
将下面的代码切换到主线程。原理就是ObservableObserveOn调用subscribe的时候本来应该是调用onNext 讲事件往下发射，但是它是先通过Handler进行线程的切换。


![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1730287550310-49e86286-9173-4fc2-9b95-b8e7ffd9e6d7.webp)

