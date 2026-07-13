## 一、基本实现逻辑
首先实现一个简单的PhoneView

```java
package com.snail.lsn7;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
```

```java
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <com.snail.lsn7.PhotoView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</FrameLayout>
```

```java
package com.snail.lsn7;

import android.animation.ObjectAnimator;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.OverScroller;

import androidx.annotation.Nullable;

public class PhotoView extends View {
    private Bitmap bitmap;
    private Paint paint;

    public PhotoView(Context context) {
        this(context, null);
    }

    public PhotoView(Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public PhotoView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(Context context) {
        // 获取bitmap对象
        bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.photo);
        paint = new Paint();

    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        // 绘制bitmap
        canvas.drawBitmap(bitmap, 0, 0, paint);
    }

}

```

效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725504689906-fb270379-37fd-4d05-ab30-cec10a5f2429.png)

创建一个放置了一张图片的应用，图片被置于左上角，现在我们想要让图片居中怎么做哪？

我们可以改变`canvas.drawBitmap(bitmap, 0, 0, paint);`传入的left和top参数改变图片绘制的位置，所以我们只要计算出这个位置传入即可，这里就用到了onSizeChanged方法，onSizeChanged是在onDraw前调用，在onMeasure方法后执行，每次改变尺寸时也会调用。重写该方法

```java
// 偏移值
private float originalOffsetX;
private float originalOffsetY;

@Override
protected void onDraw(Canvas canvas) {
	super.onDraw(canvas);

	// 绘制bitmap
	canvas.drawBitmap(bitmap, originalOffsetX, originalOffsetY, paint);
}

@Override
protected void onSizeChanged(int w, int h, int oldw, int oldh) {
	super.onSizeChanged(w, h, oldw, oldh);

	// 需要得到 浮点数，否则会留条小缝，用整数可能会少像素
	//计算图片左上点的位置，居中时左上角位置计算方式，（屏幕长宽-图片长宽）/2
	originalOffsetX = (getWidth() - bitmap.getWidth()) / 2f;
	originalOffsetY = (getHeight() - bitmap.getHeight()) / 2f;

	//图片放大时是小缩放还是大缩放，小缩放即图片全在屏幕内，短边贴边，长边留白
	//大缩放即短的一边贴边，长的一边超出屏幕，或者放大到长短边都超出屏幕
	// 图片是横向的
	if ((float) bitmap.getWidth() / bitmap.getHeight() > (float) getWidth() / getHeight()) {
		smallScale = (float) getWidth() / bitmap.getWidth();
		bigScale = (float) getHeight() / bitmap.getHeight() * OVER_SCALE_FACTOR;
	} else { // 纵向的图片
		smallScale = (float) getHeight() / bitmap.getHeight();
		bigScale = (float) getWidth() / bitmap.getWidth() * OVER_SCALE_FACTOR;
	}
	currentScale = smallScale;
}
```

如上代码，定义偏移值originalOffsetX和originalOffsetY，通过计算得到居中后的left和top位置，注意要使用浮点数，否则会留条小缝，用整数可能计算时会少像素。修改后效果如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725505223870-39e02f5e-0b5a-4cb5-a81b-d24a10c14ba7.png)

但是我们一般居中的时候可能会贴边显示，所以我们还需要绘制成全屏，要找到一个缩放比例，而缩放时涉及两个问题，一个是图片，图片分为横向即宽高比大于1，竖向即宽高比小于1，另一个问题是屏幕是横向还是竖向，

所以在缩放时要通过这些因素计算一个符合我们要求的缩放比例，

我们定义两个缩放比例，一个是小缩放，让图片一边贴边，一边留白，一个是大缩放，让图片可以超出屏幕，通过滑动查看超出范围的部分

```java
 // 一边全屏，一边留白
private float smallScale;
// 一边全屏，一边超出屏幕
private float bigScale;
private float OVER_SCALE_FACTOR = 1.5f;
private float currentScale;


@Override
protected void onDraw(Canvas canvas) {
	super.onDraw(canvas);

	// 绘制缩放
    canvas.scale(currentScale, currentScale, getWidth() / 2f, getHeight() / 2f);
	// 绘制bitmap
	canvas.drawBitmap(bitmap, originalOffsetX, originalOffsetY, paint);
}

@Override
protected void onSizeChanged(int w, int h, int oldw, int oldh) {
	super.onSizeChanged(w, h, oldw, oldh);

	originalOffsetX = (getWidth() - bitmap.getWidth()) / 2f;
	originalOffsetY = (getHeight() - bitmap.getHeight()) / 2f;

	//通过图片长宽和屏幕长宽计算缩放比例
	if ((float) bitmap.getWidth() / bitmap.getHeight() > (float) getWidth() / getHeight()) {
		smallScale = (float) getWidth() / bitmap.getWidth();
		bigScale = (float) getHeight() / bitmap.getHeight() * OVER_SCALE_FACTOR;
	} else { // 纵向的图片
		smallScale = (float) getHeight() / bitmap.getHeight();
		bigScale = (float) getWidth() / bitmap.getWidth() * OVER_SCALE_FACTOR;
	}
	currentScale = smallScale;
}
```

首先定义了小缩放和大缩放比例，同时定义了当前使用的缩放比例是smallScale，在onDraw绘制前调用`canvas.scale(currentScale, currentScale, getWidth() / 2f, getHeight() / 2f);`执行缩放变换，会让我们将图片在中心点以currentScale比例缩放x、y轴的大小。

效果如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725506103001-45b54933-a5fd-47cb-a71d-af0403c78900.png)

> `canvas.scale(float sx, float sy, float px, float py);`
>
> 参数解释：
>
> + `sx`：X轴的缩放因子。如果 `sx` 大于 1，则图形在水平方向上放大；如果小于 1 且大于 0，则图形在水平方向上缩小；如果等于 0，则水平方向上不绘制任何内容。
> + `sy`：Y轴的缩放因子。如果 `sy` 大于 1，则图形在垂直方向上放大；如果小于 1 且大于 0，则图形在垂直方向上缩小；如果等于 0，则垂直方向上不绘制任何内容。
> + `px`：缩放的中心点在 X 轴的坐标。如果为 `0`，则表示缩放中心点在画布的左边缘。
> + `py`：缩放的中心点在 Y 轴的坐标。如果为 `0`，则表示缩放中心点在画布的底部边缘。
>
> 如果不指定 `px` 和 `py`，则默认为 `(0, 0)`，即画布的左下角。
>

## 二、双击响应流程
如果我们想添加双击放大的效果，即双击后图片进行缩放，我们想到了onTouchEvent，即判断点击时间间隔去做处理，但是太麻烦了，android系统已经给我们提供了一个工具，即GestureDetector，他的内部类`GestureDetector.SimpleOnGestureListener`是一个用于监听触摸手势的类，提供了一组回调方法可以处理各种手势事件，我们创建一个内部类继承GestureDetector.SimpleOnGestureListener并重写他的全部方法，下面是所有的方法和作用说明。

```java
class PhotoGestureListener extends GestureDetector.SimpleOnGestureListener {
	/
	 * 当用户执行了一次点击（即按下后松开，没有移动）后触发。如果需要处理单击事件，应重写此方法
	 * Up时触发  双击的时候，触发两次？？第二次抬起时触发
	 * @param e 表示触发事件的触摸动作
	 * @return
	 */
	@Override
	public boolean onSingleTapUp(MotionEvent e) {
		return super.onSingleTapUp(e);
	}

	/
	 * 当用户长按屏幕时触发。长按通常用于弹出上下文菜单或执行其他长时间操作
	 * 默认是300ms
	 * @param e 表示触发长按事件的触摸动作.
	 */
	@Override
	public void onLongPress(MotionEvent e) {
		super.onLongPress(e);
	}

    /
     * 类似move事件，当用户在屏幕上滑动时触发，可以用来实现滚动视图的效果。
     * distanceX和distanceY以屏幕左上角为（0,0）,X 轴向右为正方向，Y 轴向下为正方向。
     * 用户向右滑动（即手指从左向右移动），则 distanceX 为正值；如果用户向左滑动（即手指从右向左移动），则 distanceX 为负值。
     * 用户向下滑动（即手指从上向下移动），则 distanceY 为正值；如果用户向上滑动（即手指从下向上移动），则 distanceY 为负值
     * @param e1 滚动开始时的触摸事件
     * @param e2 滚动结束时的触摸事件
     * @param distanceX 在 X 轴上滑过的距离（单位时间） x轴偏移量 = 旧位置x - 新位置
     * @param distanceY 在 Y 轴上滑过的距离（单位时间） x轴偏移量 = 旧位置 - 新位置
     * @return
     */
	@Override
	public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
		return super.onScroll(e1, e2, distanceX, distanceY);
	}

	// 抛掷

	/
	 * 当用户快速滑动（即“滑动”）屏幕时触发，可以用来实现翻页或快速滚动的效果。
	 * @param e1 滑动开始时的触摸事件.
	 * @param e2 滑动结束时的触摸事件.
	 * @param velocityX 在 X 轴上的滑动速度.
	 * @param velocityY 在 Y 轴上的滑动速度.
	 * @return
	 */
	@Override
	public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
		return super.onFling(e1, e2, velocityX, velocityY);
	}

	// 延时触发 100ms -- 点击效果，水波纹

	/
	 * 当用户按下屏幕并保持一段时间（通常很短）后触发，可以用来给用户反馈，表明应用已经识别到按压
	 * 延时触发 100ms -- 可以用于点击效果，比如水波纹，100ms后出现这个效果
	 * @param e 表示触发显示按压事件的触摸动作
	 */
	@Override
	public void onShowPress(MotionEvent e) {
		super.onShowPress(e);
	}

	/
	 * 当用户按下屏幕时立即触发。如果返回 true，则表示事件被消费，不再传递给其他视图
	 * 直接返回true
	 * @param e 表示触发按下事件的触摸动作.
	 * @return
	 */
	@Override
	public boolean onDown(MotionEvent e) {
		return true;
	}

	/
	 * 当用户快速连续点击两次时触发。如果需要处理双击事件，应重写此方法
	 * 第二次点击按下的时候 -- 点击间隔40ms -- 300ms之间，（小于40ms表示：防抖动）
	 * @param e 表示触发双击事件的触摸动作.
	 * @return
	 */
	@Override
	public boolean onDoubleTap(MotionEvent e) {
		return super.onDoubleTap(e);
	}

	/
	 * 在双击事件序列中，除了第一次点击和第二次点击外，其他所有的点击都会触发此方法
	 * 双击第二次 down、move、up都会触发
	 * @param e 表示双击事件中的一个触摸动作.
	 * @return
	 */
	@Override
	public boolean onDoubleTapEvent(MotionEvent e) {
		return super.onDoubleTapEvent(e);
	}

	/
	 * 当用户执行了一次点击，并且系统确认这不是双击的一部分时触发。这通常用于处理单击事件，因为它不会与双击事件冲突
	 * 单击按下时触发，双击时不触发，双击但第二次超过300ms触发TAP事件
	 * @param e 表示触发确认单击事件的触摸动作.
	 * @return
	 */
	@Override
	public boolean onSingleTapConfirmed(MotionEvent e) {
		return super.onSingleTapConfirmed(e);
	}
}
```

现在开始处理我们的双击事件，onDoubleTap实现我们的逻辑

定义一个isEnlarge表示当前放大(true)还是缩小(false)，通过取反得到是否要放大还是缩小，然后改变当前缩放比例并刷新绘制

```java
public boolean onDoubleTap(MotionEvent e) {
	isEnlarge = !isEnlarge;
	if (isEnlarge) {
		currentScale = bigScale;
	} else {
		currentScale = smallScale;
	}
	invalidate();
	return super.onDoubleTap(e);
}
```

现在我们只是定义了PhotoGestureListener但并没有使用，所以我们要初始化PhotoGestureListener并和我们的事件建立联系

首先是初始化对象

```java
private GestureDetector gestureDetector;

private void init(Context context) {
	// 获取bitmap对象
	bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.photo);
	paint = new Paint();
	gestureDetector = new GestureDetector(context, new PhotoGestureListener());
}
```

然后是建立事件联系

建立事件联系需要通过我们的onTouchEvent，因为GestureDetector还是通过onTouchEvent处理的事件并回调给我们

```java
@Override
public boolean onTouchEvent(MotionEvent event) {
    return gestureDetector.onTouchEvent(event);
}
```

运行程序效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725508228919-0704c631-ebb3-4eed-99d3-041017c15479.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725508238579-5635ddfc-ea0b-4a38-bf7c-5c9eae210d43.png)


## 三、添加属性动画
属性动画我们一般使用ObjectAnimator，另外还有ValueAnimator，较多的就是ObjectAnimator，ObjectAnimator相当于特殊的ValueAnimator

定义一个属性动画对象，定义一个初始化获取方法，使用方法就是`ObjectAnimator.ofXXX`,属性动画就是可以改变属性值的，所以我们在使用ObjectAnimator.ofFloat(this, "currentScale", 0);的时候，属性里必须要有currentScale属性才可以，必须定义该属性。但是只定义该属性还是会报错，必须重写set方法，因为会通过反射调用set方法，定义set方法后，每次改变值我们都调用invalidate去重新绘制。

```java
/
 * 属性动画，设置放大缩小的效果
 */
private ObjectAnimator scaleAnimator;

private ObjectAnimator getScaleAnimator() {
	if (scaleAnimator == null) {
		scaleAnimator = ObjectAnimator.ofFloat(this, "currentScale", 0);
	}
	//放大缩小的范围 smallScale---bigScale
	scaleAnimator.setFloatValues(smallScale, bigScale);
	return scaleAnimator;
}
// 属性动画，值会不断地从 smallScale 慢慢 加到 bigScale， 通过反射调用改方法
public void setCurrentScale(float currentScale) {
    this.currentScale = currentScale;
    invalidate();
}
```

修改我们之前的双击代码，当双击是启动属性动画，让画面慢慢从小变到大，缩小时慢慢变小

```java
public boolean onDoubleTap(MotionEvent e) {
	isEnlarge = !isEnlarge;
	if (isEnlarge) {
		// 启动属性动画,从小变到大
		getScaleAnimator().start();
	} else {
		//从大变到小
		getScaleAnimator().reverse();
	}
	invalidate();
	return super.onDoubleTap(e);
}
```

关于动画和绘制的知识会专门开一个章节学习

## 四、滑动设置动画偏移量
在学习SimpleOnGestureListener的时候，重写的回调接口中有个是onScroll处理滑动的回调，我们需要在这里面设置滑动时phoneView的偏移量，在onScroll时，参数中有x和y轴的滑动距离，我们定义一个x轴偏移量offsetX和y轴偏移量offsetY，记录当前图片的便宜情况，distanceX和distanceY以屏幕左上角为（0,0）,X 轴向右为正方向，Y 轴向下为正方向。用户向右滑动（即手指从左向右移动），则 distanceX 为正值；如果用户向左滑动（即手指从右向左移动），则 distanceX 为负值。用户向下滑动（即手指从上向下移动），则 distanceY 为正值；如果用户向上滑动（即手指从下向上移动），则 distanceY 为负值。所以当前的图片偏移量=旧位置偏移量-移动距离。当计算完毕偏移量后，调用invalidate刷新绘制，在我们重新onDraw时，需要调用canvas.translate执行平移变换。这样图片就可以通过手势移动了。

```java
private float offsetX;
private float offsetY;

@Override
protected void onDraw(Canvas canvas) {
	super.onDraw(canvas);

	float scaleFraction = (currentScale - smallScale) / (bigScale - smallScale);
	canvas.translate(offsetX * scaleFraction, offsetY * scaleFraction);

	// smallScale --》 bigScale
	canvas.scale(currentScale, currentScale, getWidth() / 2f, getHeight() / 2f);

	// 绘制bitmap
	canvas.drawBitmap(bitmap, originalOffsetX, originalOffsetY, paint);
}

```

```java
@Override
public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
	// 只有在放大的情况下，才能进行移动
	if (isEnlarge) {
		offsetX -= distanceX;
		offsetY -= distanceY;
		invalidate();
	}
	return super.onScroll(e1, e2, distanceX, distanceY);
}
```

效果如图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725516999324-e03c9beb-2a30-426a-a447-95b9392d31f9.png)---滑动后--->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725516987938-e6ce7b5e-df34-4d4e-b4cb-ec34e9d25f82.png)

在这里有个地方需要注意，即canvas.translate调用的位置，我们现在是在canvas.scale前调用，如果放在canvas.scale后调用会怎么样哪？因为放在canvas.scale后，先进行了图片伸缩，在进行偏移量移动，会导致我们稍微一滑动图片，图片的位移就特别大，这是为什么哪？是因为canvas.scale后，坐标被伸缩了，即如下图所示


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725517421840-c3562105-1863-42bf-adc5-36b29241a7da.png)

原本我们的坐标，(0,1)和(1,0)的位置在绿色标记处，当我们放大图片后，图片和坐标轴都同比例放大，此时的(0,1)和(1,0)相对于我们眼睛看到的位置跑到了红色标记处，所以相比于先偏移再伸缩的情况，当我们先伸缩再按照原来偏移量偏移，会发现同样移动单位为1的距离，后者的图片会移动更快，幅度更大。

> 画布上执行平移变换
>
> `canvas.translate(float dx, float dy);`
>
> 参数解释：
>
> + `dx`：在 X 轴方向上的平移距离。正值表示向右平移，负值表示向左平移。
> + `dy`：在 Y 轴方向上的平移距离。正值表示向下平移，负值表示向上平移。
>
> 这个方法的作用是将画布上的绘制原点（通常是左上角的 (0,0) 点）按照指定的距离平移。这意味着所有后续的绘制操作都会相对于新的原点进行。
>
> 平移操作是累积的，即连续调用 `translate` 会连续改变图形的位置。此外，平移操作也会影响后续的绘制操作，直到调用 `canvas.restore()` 来恢复到之前的状态。如果需要在绘制过程中保存和恢复画布的状态，可以使用 `canvas.save()` 和 `canvas.restore()` 方法。每次调用 `save` 后，可以进行一系列的变换和绘制操作，然后通过调用 `restore` 来撤销这些操作，恢复到保存时的状态
>

继续优化我们的滑动逻辑，当我们移动到边界时不应该继续滑动图片例如效果中滑出图片后有很多留白，所以要针对滑出图片到留白区域时不能再继续滑动图片，根据我们之前的设计，图片居中显示，上下能移动的最大距离=(放大后图片的高度-屏幕高度)/2，左右能移动的最大距离距离=(放大后图片的宽度-屏幕宽度)/2

所以onScroll计算出偏移量后还要再计算是否已达到最大偏移，如下所示

```java
@Override
public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
	// 只有在放大的情况下，才能进行移动
	if (isEnlarge) {
		offsetX -= distanceX;
		offsetY -= distanceY;
		fixOffsets();
		invalidate();
	}
	return super.onScroll(e1, e2, distanceX, distanceY);
}
```

```java
private void fixOffsets() {
	offsetX = Math.min(offsetX, (bitmap.getWidth() * bigScale - getWidth()) / 2);
	offsetX = Math.max(offsetX, -(bitmap.getWidth() * bigScale - getWidth()) / 2);
	offsetY = Math.min(offsetY, (bitmap.getHeight() * bigScale - getHeight()) / 2);
	offsetY = Math.max(offsetY, -(bitmap.getHeight() * bigScale - getHeight()) / 2);
}
```

效果：可以滑动到边界，之后无法再滑动图片

## 五、实现惯性滑动效果
假如我们想实现抛掷的效果，也就是惯性的滑动，我们点击屏幕短时间内滑动后松手时，图片会按照我们的偏移量滑动并且按照惯性继续偏移一部分，这部分的效果是在onFling里去实现的，而且我们要借助工具Scroller，但是Scroller是不会回弹的，所以我们使用OverScroller去处理，先学习下OverScroller

### 1、overScroller
`OverScroller` 类提供了一个用于模拟物理模型（如弹簧运动）的滚动动作的工具。`OverScroller` 比传统的 `Scroller` 类更先进，因为它可以处理超过内容范围的滚动（即“橡皮筋”效果），并且可以更准确地模拟物理滚动行为。

`OverScroller` 类的 `fling` 方法用于启动一个快速滑动（fling）动作，这个动作会根据给定的初始速度和摩擦系数模拟物理滚动。这个方法通常用于实现滑动视图（如 `RecyclerView` 或 `ScrollView`）的惯性滚动效果。

`fling` 方法的基本语法如下：

```java
boolean fling(int startX, int startY, int velocityX, int velocityY,
			  int minX, int maxX, int minY, int maxY);
```

`overX` 和 `overY`：分别是在 X 轴和 Y 轴上超过内容边界时的额外滚动距离。这些参数允许视图在滚动到内容的边缘时继续滚动一段距离，然后反弹回，模拟了“橡皮筋”效果。

参数解释：

+ `startX` 和 `startY`：分别是 fling 动作开始时的 X 和 Y 坐标。
+ `velocityX` 和 `velocityY`：分别是 fling 动作在 X 和 Y 轴上的初始速度（以像素为单位）。正值表示向右或向下的滑动，负值表示向左或向上的滑动。
+ `minX` 和 `maxX`：分别是滚动视图在 X 轴上的最小和最大滚动范围。
+ `minY` 和 `maxY`：分别是滚动视图在 Y 轴上的最小和最大滚动范围。

返回值：

+ `boolean`：如果 fling 动作被成功启动，则返回 `true`；否则返回 `false`。

使用 `fling` 方法时，通常在触摸事件的 `onFling` 回调中调用，以根据用户的滑动速度和方向启动滚动动作。在滚动过程中，需要定期调用 `OverScroller` 的 `computeScrollOffset` 方法来更新滚动位置，并在 `View` 的 `computeScroll` 方法中应用这些位置更新。

例如，以下是一个简单的使用 `OverScroller` 的 `fling` 方法的例子：

```java
OverScroller overScroller = new OverScroller(context);
overScroller.fling(0, 0, (int) velocityX, (int) velocityY, 0, 1000, 0, 500, 0, 0);
```

在这个例子中，`fling` 方法被用来启动一个在 Y 轴上的速度为 `velocityY` 的滚动动作，滚动范围在 0 到 500 之间，没有额外的超出内容的滚动距离（`overX` 和 `overY` 都设置为 0）。

请注意，`OverScroller` 的使用需要与 `View` 的绘制和滚动逻辑紧密集成，以确保滚动动作的平滑和准确。

### 2、实现惯性滑动
知道`OverScroller` 的使用方法后，就可以在onFling中去实现这个效果了，代码如下：

```java
private OverScroller overScroller;
private FlingRunner flingRunner;
private void init(Context context) {
	//......
	overScroller = new OverScroller(context);

	flingRunner = new FlingRunner();

	//......
}
```

```java
@Override
public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
	if (isEnlarge) {
		// 只会处理一次
		overScroller.fling((int) offsetX, (int) offsetY, (int) velocityX, (int) velocityY,
				-(int) (bitmap.getWidth() * bigScale - getWidth()) / 2,
				(int) (bitmap.getWidth() * bigScale - getWidth()) / 2,
				-(int) (bitmap.getHeight() * bigScale - getHeight()) / 2,
				(int) (bitmap.getHeight() * bigScale - getHeight()) / 2, 600, 600);
		postOnAnimation(flingRunner);
	}
	return super.onFling(e1, e2, velocityX, velocityY);
}
```

```java
class FlingRunner implements Runnable {

	@Override
	public void run() {
		// 动画还在执行 则返回true
		if (overScroller.computeScrollOffset()) {
			offsetX = overScroller.getCurrX();
			offsetY = overScroller.getCurrY();
			invalidate();
			// 反复执行到动画结束，
            // 没有使用post而使用postOnAnimation是因为每帧动画执行一次，性能更好
			postOnAnimation(this);
		}
	}
}
```

在onFling中使用overScroller的fling去启动快速滑动动作，因为动作只会处理一次，需要定期调用 `OverScroller` 的 `computeScrollOffset` 方法来更新滚动位置，所以定义一个FlingRunner去反复执行直到动画结束。

## 六、实现双指缩放效果
### 1、ScaleGestureDetector.OnScaleGestureListener
如何实现双指缩放效果，也要用到android提供的一个API，ScaleGestureDetector.OnScaleGestureListener，首先先看下该API的说明

```java
/
 * 监听和处理缩放手势
 */
class PhotoScaleGestureListener implements ScaleGestureDetector.OnScaleGestureListener {

	/
	 * 当缩放手势正在进行时，这个方法会被调用。开发者可以在这个方法中根据缩放比例来调整视图的大小或其他属性
	 * @param detector 提供了缩放手势的相关信息，如缩放比例、焦点位置等。.
	 * @return
	 */
	@Override
	public boolean onScale(ScaleGestureDetector detector) {
		return false;
	}

	/
	 * 当缩放手势开始时，这个方法会被调用。可以在这个方法中初始化一些变量，
	 * 或者设置是否要处理这个缩放手势（通过返回 true 或 false）
	 * @param detector 提供了缩放手势的相关信息.
	 * @return 如果返回 true，则表示希望处理这个缩放手势，消费事件，
	 *         如果返回 false，则表示不希望处理这个手势，它可能会被其他视图处理
	 */
	@Override
	public boolean onScaleBegin(ScaleGestureDetector detector) {
		return false;
	}

	/
	 * 当缩放手势结束时，这个方法会被调用。可以在这个方法中执行一些清理工作，
	 * 或者对缩放后的视图状态进行最终调整
	 * @param detector 提供了缩放手势的相关信息.
	 */
	@Override
	public void onScaleEnd(ScaleGestureDetector detector) {

	}
}
```

`ScaleGestureDetector` 是一个帮助类，它封装了缩放手势的检测逻辑。要使用 `OnScaleGestureListener`，你需要创建一个实现了这个接口的类，并在其中重写上述方法。然后，你可以将这个监听器实例与 `ScaleGestureDetector` 关联起来，后者会监听触摸事件并调用相应的回调方法。

以下是一个简单的示例，展示了如何创建一个 `OnScaleGestureListener` 实现：

创建一个 `ScaleGestureDetector` 实例并将上面创建的 `PhotoScaleGestureListener`与它关联起来

```java
ScaleGestureDetector scaleGestureDetector = new ScaleGestureDetector(context, new PhotoScaleGestureListener());
```

在触摸事件的处理中，你需要将事件传递给 `scaleGestureDetector`：

```java
@Override
public boolean onTouchEvent(MotionEvent event) {
    scaleGestureDetector.onTouchEvent(event);
    return super.onTouchEvent(event);
}
```

### 2、实现双指缩放
学习了`OnScaleGestureListener` 的使用方法，现在可以去代码实现了，初始化ScaleGestureDetector对象并将事件传递给`scaleGestureDetector`，这里我们让双指缩放优先，没有使用双指时再去使用触摸手势处理。

```java
private ScaleGestureDetector scaleGestureDetector;
private void init(Context context) {
	// 获取bitmap对象
	bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.photo);
	paint = new Paint();

	gestureDetector = new GestureDetector(context, new PhotoGestureListener());

	overScroller = new OverScroller(context);

	flingRunner = new FlingRunner();

	scaleGestureDetector = new ScaleGestureDetector(context, new PhotoScaleGestureListener());
}
@Override
public boolean onTouchEvent(MotionEvent event) {
	boolean result = scaleGestureDetector.onTouchEvent(event);
	if (!scaleGestureDetector.isInProgress()) {
		result = gestureDetector.onTouchEvent(event);
	}
	return result;
}
/
 * 监听和处理缩放手势
 */
class PhotoScaleGestureListener implements ScaleGestureDetector.OnScaleGestureListener {

	//设置一个变量保存缩放值
	float initialScale;
	/
	 * 当缩放手势正在进行时，这个方法会被调用。
	 * 可以在这个方法中根据缩放比例来调整视图的大小或其他属性
	 * @param detector 提供了缩放手势的相关信息，如缩放比例、焦点位置等。.
	 * @return
	 */
	@Override
	public boolean onScale(ScaleGestureDetector detector) {
		if ((currentScale > smallScale && !isEnlarge)
				|| (currentScale == smallScale && isEnlarge)) {
			isEnlarge = !isEnlarge;
		}
		currentScale = initialScale * detector.getScaleFactor();
		invalidate();
		return false;
	}

	/
	 * 当缩放手势开始时，这个方法会被调用。开发者可以在这个方法中初始化一些变量，
	 * 或者设置是否要处理这个缩放手势（通过返回 true 或 false）
	 * @param detector 提供了缩放手势的相关信息.
	 * @return 如果返回 true，则表示你希望处理这个缩放手势，消费事件；
	 *         如果返回 false，则表示你不希望处理这个手势，它可能会被其他视图处理
	 */
	@Override
	public boolean onScaleBegin(ScaleGestureDetector detector) {
		//默认缩放比例等于当前缩放比例
		initialScale = currentScale;
		return false;
	}

	/
	 * 当缩放手势结束时，这个方法会被调用。开发者可以在这个方法中执行一些清理工作，
	 * 或者对缩放后的视图状态进行最终调整
	 * @param detector 提供了缩放手势的相关信息.
	 */
	@Override
	public void onScaleEnd(ScaleGestureDetector detector) {

	}
}
```

## 七、平移校准
当我们已经设计好了代码，有惯性滑动也有双指缩放等效果，但是我们发现几个问题

1.当放大后移动图片，再缩小时，图片的位置没有回到初始的位置，再次放大时，还是在原来移动后的偏移位置

2.当点击某个地方缩放时，并不是以触摸点为中心进行的缩放

3.双指放大一点点后，双击缩小会闪烁

所以我们要对缩放的位置进行校准，代码逻辑也需要完善效果才会更好，比如做成类似相册中的效果，某个左上角的图片放大会全屏显示，缩小后又回到原来的位置等等。

下面针对三个问题一个个进行分析。

### 1、缩放不恢复位置
1.offset的值在放大和缩小都是按照之前滑动时移动的距离计算的偏移值，即时缩小后再次放大，偏移值没有做过更改，还是按照上一次的值变化，在onDraw中平移变化前计算放大缩小的因子

`float scaleFraction = (currentScale - smallScale) / (bigScale - smallScale);`按照当前放大缩小的比例计算偏移量的大小，`canvas.translate(offsetX * scaleFraction, offsetY * scaleFraction);`如果是smallScale则scaleFraction为0，也就是缩小后偏移量为0，图片回到原来位置，但是双击后图片仍然回到之前的偏移位置，因为bigScale时scaleFraction为1，offset没有发生改变，绘制的图仍是之前移动过的偏移位置，所以在双击放大时设置offset的偏移量为0即可再次回到居中位置。

```java
protected void onDraw(Canvas canvas) {
	super.onDraw(canvas);
	float scaleFraction = (currentScale - smallScale) / (bigScale - smallScale);
	canvas.translate(offsetX * scaleFraction, offsetY * scaleFraction);
	canvas.scale(currentScale, currentScale, getWidth() / 2f, getHeight() / 2f);
	// 绘制bitmap
	canvas.drawBitmap(bitmap, originalOffsetX, originalOffsetY, paint);
}

public boolean onDoubleTap(MotionEvent e) {
    isEnlarge = !isEnlarge;
    if (isEnlarge) {
        offsetX = 0;
        offsetY = 0;
        // 启动属性动画,从小变到大
        getScaleAnimator().start();
    } else {
        //从大变到小
        getScaleAnimator().reverse();
    }
    //属性动画里刷新，这里就不需要了
    //invalidate();
    return super.onDoubleTap(e);
}
```

### 2、不能按照点击位置进行缩放
2.按照上面的改完后，看第二个问题，当点击某个地方缩放时，并不是以触摸点为中心进行的缩放，如上，我们每次双击后都是居中显示，并没有实现点击某处以当前点击位置放大，所以onDoubleTap中在放大时应该根据点击位置计算当前的偏移量，代码如下：

```java
public boolean onDoubleTap(MotionEvent e) {
	isEnlarge = !isEnlarge;
	if (isEnlarge) {
        offsetX = (e.getX() - getWidth() / 2f) - (e.getX() - getWidth() / 2) * bigScale / smallScale;
        offsetY = (e.getY() - getHeight() / 2f) - (e.getY() - getHeight() / 2) * bigScale / smallScale;
        fixOffsets();
		// 启动属性动画,从小变到大
		getScaleAnimator().start();
	} else {
		//从大变到小
		getScaleAnimator().reverse();
	}
	//属性动画里刷新，这里就不需要了
	//invalidate();
	return super.onDoubleTap(e);
}
```

代码中的offsetX和offsetY为什么这样计算？

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725538328520-45ac7e1b-019b-4bdd-b4ac-7518e015605c.jpeg)

如图所示，内部的橙色框代表我们代码设计后图片小缩放时的居中位置，中间的蓝色框代表手机屏幕，外部的橙色框代表大缩放时的图片居中位置，

如果我们以小缩放时的坐标作为标准视角下的坐标，双击图片上a的位置，放大后图片上a的位置在我们眼中会偏移到b的位置，而我们想要实现的效果是，双击a的位置，图片放大后，a点的图片内容仍然移动到a的位置显示。所以我们要计算放大后b的图片位置在放大前的坐标轴上移动到a点的偏移量。

如何计算这个偏移值，首先我们要更换下参考的坐标系，

以居中时的中心点为原点(0,0)，建立坐标系且向右为x正轴，向下为y正轴

那么a的位置计算如下：

`x = e.getX() - getWidth()/2 `

`y = e.getY() - getHeight()/2`

如何计算b的位置？

因为我们的坐标和图片一样是同比例缩放，所以

缩放前后的坐标系缩放比例 = 放大后使用的缩放比例(bigScale) / 缩放前的缩放比例(smallScale)

即：`scaleFactor = bigScale / smallScale`

所以b点的位置：

`b.x = x * scaleFactor`

`b.y = y * scaleFactor`

那么我们的偏移量也就知道是多少了，即a的位置减去b的位置，代码如下：

```java
offsetX = (e.getX() - getWidth() / 2f) - (e.getX() - getWidth() / 2) * bigScale / smallScale;
offsetY = (e.getY() - getHeight() / 2f) - (e.getY() - getHeight() / 2) * bigScale / smallScale;

```

### 3、双指缩放再点击缩放出现闪烁
3.因为双指放大是smallScale到currentScale，而双击是直接从bigScale到smallScale，所以会出现闪烁，设置一个标志表示是双指放大，当双指放大后，双击缩小时从范围设置为smallScale到currentScale，如果想设置诸如双指放大超过某个值，双击会缩小，未超过双击放大可以再通过代码逻辑适配

```java
private boolean isScale;
private ObjectAnimator getScaleAnimator() {
	if (scaleAnimator == null) {
		scaleAnimator = ObjectAnimator.ofFloat(this, "currentScale", 0);
	}
	if (isScale) {
		isScale = false;
		scaleAnimator.setFloatValues(smallScale, currentScale);
	} else {
		//             放大缩小的范围
		scaleAnimator.setFloatValues(smallScale, bigScale);
	}
	return scaleAnimator;
}

@Override
public boolean onScale(ScaleGestureDetector detector) {
	if ((currentScale > smallScale && !isEnlarge)
		|| (currentScale == smallScale && isEnlarge)) {
		isEnlarge = !isEnlarge;
	}
	currentScale = initialScale * detector.getScaleFactor();
	isScale = true;
	invalidate();
	return false;
}
```


以上就是photoView的手势处理及双指操作的整体内容，当然代码还可以做的更加精细使显示效果更佳，以后在做补充。

