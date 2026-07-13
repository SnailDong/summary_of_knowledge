如果我们使用的canvas去绘制，使用贝塞尔曲线绘制，我们可以绘制任意的效果，使用贝塞尔曲线，实现一个摆动的锦鲤，并且能够向着触摸点下的位置移动，效果如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726019351688-74076a9a-922e-4b01-a119-fe3bfc9d8c7e.png)

绘制一个自定义的动画效果，首先我们要先拆解这个动画，思路如下：

1、实现静态的效果

2、实现原地动态的效果

3、实现交互(点击)下的动态效果

所以锦鲤的绘制实现步骤如下：

1、实现小鱼的绘制

2、实现小鱼的原地摆动

3、实现小鱼点击游动

## 一、静态绘制
### 1、图形分解
首先实现小鱼的绘制，我们把小鱼的整个身体分解后如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726019507659-b8d03272-053c-4b69-97dc-9d74681797a2.png)

整个身体就是有一些曲线、圆、三角图形绘制而成的，而这些曲线都是由我们的贝塞尔曲线绘制的。

绘制这些我们使用自定义Drawable来实现。

> 为什么使用Drawable?Drawable是什么？
>
> 1、一种可以在Canvas上进行绘制的抽象的概念
>
> 2、颜色、图片等都可以是一个Drawable
>
> 3、Drawable可以通过XML定义，或者通过代码创建
>
> 4、Android中Drawable是一个抽象类，每个具体的Drawable都是其子类
>
> Drawable的优点：
>
> 1、使用简单，比自定义View成本低
>
> 2、非图片类的Drawable所占空间小，能减少apk大小
>

### 2、自定义Drawable类
自定义一个FishDrawable继承Drawable，Drawable需要重写的方法和作用如下：

```java
package com.leo.lsn12;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.PointF;
import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class FishDrawable extends Drawable {

    private Paint mPaint;
    private Path mPath;
    // 身体之外的部分的透明度
    private final static int OTHER_ALPHA = 110;
    // 身体的透明度
    private final static int BODY_ALPHA = 160;

    public final static float HEAD_RADIUS = 150;

    public FishDrawable() {
        init();
    }

    private void init() {
        mPath = new Path();// 路径
        mPaint = new Paint();// 画笔
        mPaint.setStyle(Paint.Style.FILL);// 画笔类型，填充
        mPaint.setARGB(OTHER_ALPHA, 244, 92, 71);// 设置颜色
        mPaint.setAntiAlias(true);// 抗锯齿
        mPaint.setDither(true);// 防抖

        middlePoint = new PointF(4.19f * HEAD_RADIUS, 4.19f * HEAD_RADIUS);
    }

    @Override
    public void draw(@NonNull Canvas canvas) {

    }

    /
     * 设置透明度的方法
     * @param alpha
     */
    @Override
    public void setAlpha(int alpha) {
        // 设置Drawable的透明度，一般情况下将此alpha设置给Paint
        mPaint.setAlpha(alpha);
    }

    // 设置颜色过滤器

    /
     * 设置了一个颜色过滤器，那么在绘制出来之前，被绘制内容的每一个像素都会被颜色过滤器改变
     * @param colorFilter 颜色过滤器，为null时移除颜色过滤器
     */
    @Override
    public void setColorFilter(@Nullable ColorFilter colorFilter) {
        // 设置颜色过滤器，一般情况下将此值设置给Paint
        mPaint.setColorFilter(colorFilter);
    }

    /
     * 这个值，可以根据setAlpha中设置的值进行调整。比如，alpha == 0时设置为 PixelFormat.TRANSPARENT.
     * 在alpha == 255 时设置为 PixelFormat.OPAQUE。在其他时候设置为 PixelFormat.TRANSLUCENT
     * PixelFormat.OPAQUE : 完全不透明，遮盖在他下面的所有内容
     * PixelFormat.TRANSPARENT : 透明，完全不显示任何东西
     * PixelFormat.TRANSLUCENT : 只有绘制的地方才覆盖地下的内容
     * @return
     */
    @Override
    public int getOpacity() {
        // 只有绘制的地方才覆盖底下的内容
        return PixelFormat.TRANSLUCENT;
    }

    // 如果ImageView的宽高为wrap_content,则获取这个值
    @Override
    public int getIntrinsicHeight() {
        return (int) (8.38f * HEAD_RADIUS);
    }

    @Override
    public int getIntrinsicWidth() {
        return (int) (8.38f * HEAD_RADIUS);
    }
}
```

### 3、Paint画笔的运用思路
```java
mPaint = new Paint();// 画笔
mPaint.setStyle(Paint.Style.FILL);// 画笔类型，填充
mPaint.setARGB(OTHER_ALPHA, 244, 92, 71);// 设置颜色
mPaint.setAntiAlias(true);// 抗锯齿
mPaint.setDither(true);// 防抖
mPaint.setColor(Color.argb(OTHER_ALPHA,244,92,71));//设置透明度和颜色
```

设置抗锯齿效果如图：左侧是未设置抗锯齿，右侧设置了抗锯齿，设置后图形更加平滑。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726021238577-a5ced590-a496-41a4-9564-3b49d4c7e01d.png)

设置防抖效果如图：上方颜色未防抖，下方颜色防抖，防抖后颜色之间的过渡更加平滑。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726021250175-7010f2d9-db08-40b9-b1c2-d3afc976e71e.png)

### 4、如何计算锦鲤的身体大小
首先要找到图形的中心点，以我们的锦鲤为例，锦鲤的测量图如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726021845673-0c57bfee-3087-46c9-8c8e-55788fdea4d3.png)

以鱼头的圆的半径设为R设计了其他部位的大小如图，根据各部位的大小计算出锦鲤的中心点。中心点也是drawable的中心点，而我们的drawable大小并不是正好包裹锦鲤的如下的矩形：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726022303047-6f8bd0eb-e8ca-4683-a8e4-04fc6b158b8f.png)因为我们的锦鲤还会摆动和转身，所以drawable的大小是以中心点为圆点旋转一周可以包裹锦鲤的矩形，如图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726022384907-14c234ff-e685-4e47-b41a-292619a27a66.png)

根据分解的身体部位和大小定义各部位的值。

```java
// 鱼的重心（鱼身的中心）
private PointF middlePoint;

//鱼朝向的角度
private float fishMainAngle = 90;

public final static float HEAD_RADIUS = 150;

// 鱼身的长度
private final static float BODY_LENGTH = 3.2f * HEAD_RADIUS;

private final static float FIND_FINS_LENGTH = 0.9f * HEAD_RADIUS;

private final static float FINS_LENGTH = 1.3f * HEAD_RADIUS;

// -------------鱼尾---------------
// 尾部大圆的半径(圆心就是身体底部的中点)
private final float BIG_CIRCLE_RADIUS = HEAD_RADIUS * 0.7f;
// 尾部中圆的半径
private final float MIDDLE_CIRCLE_RADIUS = BIG_CIRCLE_RADIUS * 0.6f;
// 尾部小圆的半径
private final float SMALL_CIRCLE_RADIUS = MIDDLE_CIRCLE_RADIUS * 0.4f;
// --寻找尾部中圆圆心的线长
private final float FIND_MIDDLE_CIRCLE_LENGTH = BIG_CIRCLE_RADIUS + MIDDLE_CIRCLE_RADIUS;
// --寻找尾部小圆圆心的线长
private final float FIND_SMALL_CIRCLE_LENGTH = MIDDLE_CIRCLE_RADIUS * (0.4f + 2.7f);
// --寻找大三角形底边中心点的线长
private final float FIND_TRIANGLE_LENGTH = MIDDLE_CIRCLE_RADIUS * 2.7f;
```

### 5、如何计算坐标
当我们的鱼头朝向不同方向时，坐标也会变化，所以就需要我们根据角度和中心点到顶点的距离计算具体的坐标，这里要用到我们的三角函数去计算。O点相当于我们的中心点，A点相当于鱼头的圆心点，通过计算得到A点相对于O点的坐标位置。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726023294252-40583982-8521-433e-a8e2-d8b281b54fc5.png)

```java
/
     * 求对应点的坐标 -- 知道起始点，知道鱼头的角度，知道两点间的距离，就可以算出想要的点的坐标
     *
     * @param startPoint 起始点的坐标
     * @param length     两点间的长度
     * @param angle      鱼头相对于startPoint坐标的角度
     * @return
     */
public static PointF calculatePoint(PointF startPoint, float length, float angle) {
	// angle 角度（0度~360度）  三角函数 -- 弧度
	float deltaX = (float) (Math.cos(Math.toRadians(angle)) * length);
	float deltaY = (float) (-Math.sin(Math.toRadians(angle)) * length);
	return new PointF(startPoint.x + deltaX, startPoint.y + deltaY);
}
```

Math.sin()、Math.cos()的参数是弧度，我们拿到的值是角度值，需要使用Math.toRadians()将角度转成弧度去计算。

又因为在数学的坐标系中y轴正方向是上，但是我们的android画布中y轴正方向是下，所以y的位置要计算翻转180°后的值。可以使用`-Math.sin(Math.toRadians(angle))`或者`Math.sin(Math.toRadians(angle-180))`。

### 6、锦鲤鱼头绘制
1、首先是确定当前小鱼的偏向角度，

2、鱼头是一个圆，通过当前鱼头的圆心和小鱼中心点的距离和角度得到鱼头圆心位置，

3、绘制代表鱼头的圆。

```java
//定义鱼朝向的角度
private float fishMainAngle = 90;
// 鱼身的长度
private final static float BODY_LENGTH = 3.2f * HEAD_RADIUS;
@Override
public void draw(@NonNull Canvas canvas) {
	float fishAngle = fishMainAngle;

	// 绘制鱼头
	PointF headPoint = calculatePoint(middlePoint, BODY_LENGTH / 2, fishAngle);
	canvas.drawCircle(headPoint.x, headPoint.y, HEAD_RADIUS, mPaint);
}
```

首先定义了一个fishMainAngle是初始时鱼头朝向，因为鱼头向正右是便宜角度为0，所以90°就是鱼头朝上。

fishMainAngle的偏移角度也可以理解为坐标系如果一直以数学上的横向和纵向为x,y轴时，坐标系的旋转角度。

### 7、贝塞尔曲线实现锦鲤鱼鳍的绘制
圆形的绘制我们直接使用drawCircle就可以，如果想绘制鱼鳍这样的效果，就需要我们使用贝塞尔曲线进行绘制。

首先了解下贝塞尔曲线

贝塞尔曲线通过一组控制点来定义，可以生成各种复杂的曲线形状

贝塞尔曲线可以分为不同阶数，常见的有：

+ 一阶贝塞尔曲线（线性）：由两个点定义，实际上是一条直线。
    -
![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1726026254005-6b122a65-c7bd-4f6d-9132-3f6b0dff3deb.webp)
+ 二阶贝塞尔曲线（抛物线）：由三个点定义，包括起点、控制点和终点。
    -
![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1726026263418-3b47a24a-0475-4d5e-9814-e8791e755280.webp)
+ 三阶贝塞尔曲线：由四个点定义，包括起点、两个控制点和终点。
    -
![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1726026284683-699aca8c-3cd9-4fa1-a2fe-bf2f73fa060a.webp)

在Android中，`Path`类提供了绘制贝塞尔曲线的方法：

+ `quadTo(float x1, float y1, float x2, float y2)`：绘制二阶贝塞尔曲线。
+ `cubicTo(float x1, float y1, float x2, float y2, float x3, float y3)`：绘制三阶贝塞尔曲线。

贝塞尔曲线可以用于实现各种动画效果，如点赞撒花、水波纹效果等。例如通过动态改变控制点的位置，我们可以模拟波浪的运动，使用二阶贝塞尔曲线，可以通过改变控制点的Y坐标来实现波浪效果。

可以登录[https://cubic-bezier.com/#.17,.67,.83,.67](https://cubic-bezier.com/#.17,.67,.83,.67)绘制图形获取控制点坐标。

我们要绘制如下的鱼鳍的曲线，就需要知道起始点终点和控制点。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726033767096-bd090598-70bf-4b20-8d7a-ad839b78b2d4.png)

如上图的分解示意，首先我们规定：

当鱼的朝向向右时，即我们以数学上的坐标系去绘制锦鲤时，以各部位点为原点，右为x正轴，上为y正轴时

各个点的位置有如下说法：

鱼头的中心点`headPoint`是鱼身中心点`middlePoint`在`0°`偏移角度下`BODY_LENGTH / 2`长度位置的点。

鱼右鳍的开始点`rightFinsPoint`是鱼头中心点`headPoint`在`-110°`偏移角度下`FIND_FINS_LENGTH`长度位置的点。

鱼右鳍的结束点`endPoint`是鱼右鳍起始点`rightFinsPoint`在`-180°`偏移角度下`FINS_LENGTH`长度位置的点。

只需要在这些点从`middlePoint`的基础上开始计算，并且偏移角度都加上`fishMainAngle`即坐标系旋转的角度就是实际的点的位置。

后面我们直接使用偏移角度代表向右x正轴，向上y正轴时，B点相对于A点的偏移角度。

所以有如下代码：

```java
// 鱼右鳍
PointF rightFinsPoint = calculatePoint(headPoint, FIND_FINS_LENGTH, fishAngle - 110);
```

得到鱼右鳍的起始点后，我们就可以通过该起始点去绘制鱼右鳍

```java
/
* 绘制鱼鳍
*
* @param startPoint  起始点的坐标
* @param fishAngle   鱼头相对于x坐标的角度
* @param isRightFins
*/
private void makeFins(Canvas canvas, PointF startPoint, float fishAngle, boolean isRightFins) {
	//控制点偏移角度
	float controlAngle = 115;

	// 结束点
	PointF endPoint = calculatePoint(startPoint, FINS_LENGTH, fishAngle - 180);
	// 控制点
	PointF controlPoint = calculatePoint(startPoint, 1.8f * FINS_LENGTH,
										 isRightFins ? fishAngle - controlAngle : fishAngle + controlAngle);

	//先清楚保存的路径
	mPath.reset();
	//先移动到起始点位置
	mPath.moveTo(startPoint.x, startPoint.y);
	// 二阶贝塞尔曲线，参数填入控制点位置和结束点位置
	mPath.quadTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
	//绘制路径，drawPath可以自动闭合
	canvas.drawPath(mPath, mPaint);

}
```

首先根据我们前面说到的计算方法确认结束点的位置。

然后我们定义了控制点偏移角度，并且定义了偏移点位置是鱼右鳍起始点偏移`-115° `且`1.8*FINS_LENGTH`距离的点。代码中控制点根据鱼的左鳍右鳍做了判断，如果是右鳍则是`-115°`，如果是左鳍则是`+115°`。

然后就可以绘制路径了。

> Path
>
> Path封装了由直线和曲线(二次，三次贝塞尔曲线)构成的几何路径。你能用Canvas中的drawPath来把这条路径画出来（同样支持Paint的不同绘制模式），也可以用于剪裁画布和根据路径绘制文字。
>
> 注意：用drawable绘制了后，path的路径还是存在的，所以如果需要绘制新的路径，需要先调用Path的reset方法。
>
> Canvas
>
> Canvas在一般的情况下可以看作是一张画布，所有的绘图操作如drawBitmap，drawCircle都发生在这张画布上，这张画板还定义了一些属性比如Matrix，颜色等等。但是如果需要实现一些相对复杂的绘图操作，比如多层动画，地图（地图可以有多个地图层叠加而成，比如：政区层，道路层，兴趣点层）。Canvas提供了图层（Layer）支持，缺省情况可以看作是只有一个图层Layer。如果需要按层次来绘图，Android的Canvas可以使用saveLayerXXX,restore来创建一些中间层，对于这些Layer是按照“栈结构“来管理的：
>
>
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726039314489-b515399b-67bd-45cf-b276-d615c49b515e.png)
>
> 创建一个新的Layer到“栈”中，可以使用saveLayer, savaLayerAlpha,从“栈”中推出一个Layer,可以使用 restore,restoreToCount。当Layer入栈时，后续的DrawXXX操作都发生在这个Layer上，而Layer退栈时，就会把 本层绘制的图像“绘制”到上层或是Canvas上。
>

同理，我们左鳍的绘制和右鳍只是偏移角度不一样，起始点位置是相对于鱼头`110°`

```java
// 鱼左鳍
PointF leftFinsPoint = calculatePoint(headPoint, FIND_FINS_LENGTH, fishAngle + 110);
```

而左鳍的控制点也是相对于右鳍是相反的角度，是115°，如上面绘制鱼鳍的代码所示。

绘制后效果如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726044770572-308d3893-8cda-41fd-b6ed-7287da5e1805.png)

### 8、鱼尾的绘制
鱼尾的就是在图形分解中标注的节肢+尾，我们根据分解图和测量图确定要确定的点和绘制的内容。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726019507659-b8d03272-053c-4b69-97dc-9d74681797a2.png?x-oss-process=image%2Fformat%2Cwebp)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726021845673-0c57bfee-3087-46c9-8c8e-55788fdea4d3.png?x-oss-process=image%2Fformat%2Cwebp)

首先节肢1由上面的一个大圆和下面的一个中圆以及中间一个梯形组成，梯形上底是鱼尾大圆的直径，下底是鱼尾中圆的直径，梯形的上底两个边角点分别是鱼尾大圆中心点偏移`90°`和`-90°`的情况下鱼尾大圆半径距离位置，梯形的下底两个边角点分别是鱼尾中圆中心点偏移`90°`和`-90°`的情况下鱼尾中圆半径距离位置。

节肢2由下方一个小圆和上方一个梯形组成(其实上方应该是节肢1中的中圆，但是节肢1已经绘制了，节肢2就不用再绘制了)，梯形上底是鱼尾中圆的直径，下底是鱼尾小圆的直径，梯形的下底两个边角点分别是鱼尾中圆中心点偏移`90°`和`-90°`的情况下中圆半径距离位置，梯形的上底两个边角点分别是鱼尾中圆中心点偏移`90°`和`-90°`的情况下中圆半径距离位置。

鱼尾巴的是两个腰长不同的等腰三角形叠加在一块，其中三角形的一个顶点是中圆圆心，另外两个顶点我们有多种计算方式，这里以大三角形为例，

第一种是以中圆圆心为起始点偏移`90°+等腰顶角的度数`和`-(90°+等腰顶角的度数)`的情况下三角形腰长距离的位置。

第二种是先计算出中原圆心为顶点的对边中心点位置，即中圆圆心为起始点偏移`-180°`的情况下顶点到底部垂直线长距离的位置，在根据这个位置计算偏移`90°`和`-90°`的情况下底部边长一半距离的两个顶点位置。

因为我们在先前定义的是大三角形顶点到底边中心点的垂直线长：

`private final float FIND_TRIANGLE_LENGTH = MIDDLE_CIRCLE_RADIUS * 2.7f;`

所以我们计算鱼尾巴位置时采用第二种方法。

由测量图可以知道，鱼身长3.2R是鱼头的中心点和鱼尾大圆中心点的距离，既然我们前面已经求出了鱼头中心点位置，直接就可以使用鱼头中心点和3.2R计算鱼尾大圆中心点位置。

鱼尾大圆中心点是鱼头中心点`headPoint`在`-180°`偏移角度下`BODY_LENGTH`长度位置的点。(这里的`-180°`依然是以`fishAngle`为`0°`时鱼头朝右的说法)

代码如下，角度值依然要加上坐标系旋转的角度`fishAngle`。

```java
// 身体的底部的大圆中心点
PointF bodyBottomCenterPoint = calculatePoint(headPoint, BODY_LENGTH, fishAngle - 180);
// 绘制节肢1
makeSegment(canvas,bodyBottomCenterPoint,BIG_CIRCLE_RADIUS, MIDDLE_CIRCLE_RADIUS,
			FIND_MIDDLE_CIRCLE_LENGTH, fishAngle, true);

// 身体的底部的中圆中心点
PointF middleCircleCenterPoint = calculatePoint(bodyBottomCenterPoint,
												FIND_MIDDLE_CIRCLE_LENGTH, fishAngle - 180);
// 绘制节肢2
makeSegment(canvas,middleCircleCenterPoint,MIDDLE_CIRCLE_RADIUS, SMALL_CIRCLE_RADIUS,
			FIND_SMALL_CIRCLE_LENGTH, fishAngle, false);
```

根据我们上面的分析开始绘制节肢1

编写一个makeSegment方法，参数如下注释所示。

```java
// 绘制节肢1
makeSegment(canvas,bodyBottomCenterPoint,BIG_CIRCLE_RADIUS, MIDDLE_CIRCLE_RADIUS,
			FIND_MIDDLE_CIRCLE_LENGTH, fishAngle, true);
```

```java
/
* 画节肢
* @param bottomCenterPoint  梯形底部的中心点坐标（长边）
* @param bigRadius 相对大圆的半径
* @param smallRadius 相对小圆的半径
* @param findSmallCircleLength 相对大圆和相对小圆中心点之间的线长
* @param hasBigCircle 是否有相对大圆需要绘制
*/
private void makeSegment(Canvas canvas, PointF bottomCenterPoint, float bigRadius,
						 float smallRadius, float findSmallCircleLength, float fishAngle,
						 boolean hasBigCircle) {
	// 梯形上底的中心点（短边）
	PointF upperCenterPoint = calculatePoint(bottomCenterPoint, findSmallCircleLength,
											 fishAngle - 180);
	// 梯形的四个顶点
	PointF bottomLeftPoint = calculatePoint(bottomCenterPoint, bigRadius, fishAngle + 90);
	PointF bottomRightPoint = calculatePoint(bottomCenterPoint, bigRadius, fishAngle - 90);
	PointF upperLeftPoint = calculatePoint(upperCenterPoint, smallRadius, fishAngle + 90);
	PointF upperRightPoint = calculatePoint(upperCenterPoint, smallRadius, fishAngle - 90);

	if(hasBigCircle){
		// 绘制大圆
		canvas.drawCircle(bottomCenterPoint.x, bottomCenterPoint.y, bigRadius, mPaint);
	}
	// 绘制小圆
	canvas.drawCircle(upperCenterPoint.x, upperCenterPoint.y, smallRadius, mPaint);

	// 绘制梯形
	mPath.reset();
	mPath.moveTo(bottomLeftPoint.x, bottomLeftPoint.y);
	mPath.lineTo(upperLeftPoint.x, upperLeftPoint.y);
	mPath.lineTo(upperRightPoint.x, upperRightPoint.y);
	mPath.lineTo(bottomRightPoint.x, bottomRightPoint.y);
	canvas.drawPath(mPath, mPaint);
}
```

首先我们先找到了大圆的中心点`bodyBottomCenterPoint`，并且我们也定义了大圆和中圆圆心之间的距离是`FIND_MIDDLE_CIRCLE_LENGTH`，因此，我们在`makeSegment`方法中可以根据传进来的`bottomCenterPoint`即大圆中心点`bodyBottomCenterPoint`去计算中圆中心点`upperCenterPoint`，计算方法和之前一样。

找到大圆和中圆中心点位置后就可以按照上面分析过的找到四个边角点的位置。

因为我们要绘制节肢1和节肢2，所以这里通过判断参数`hasBigCircle`来确定是不是要绘制传进来的相对大圆，节肢1要绘制，节肢2因为相对大圆是鱼尾中圆，已经在节肢1中绘制了，所以不再绘制，只是用来计算节肢2中的小圆和四个边角点位置。

绘制后效果如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726044740253-12ccbb58-56ff-465f-b95a-c2153ce7ab70.png)

绘制完节肢后我们再来绘制鱼尾巴，根据之前的分析和位置计算方式，小三角形就是边长和顶点到底部的垂直长度短一些而已，这里的绘制基本和前面没什么区别，只要顶点的位置知道怎么计算就很容易绘制，不多赘述。

```java
// 绘制大三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH,
			 BIG_CIRCLE_RADIUS, fishAngle);
// 绘制小三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH - 10,
			 BIG_CIRCLE_RADIUS - 20, fishAngle);
```

```java
/
* 画三角形
* @param findCenterLength 顶点到底部的垂直线长
* @param findEdgeLength 底部一半
*/
private void makeTriangle(Canvas canvas, PointF startPoint,
						  float findCenterLength, float findEdgeLength, float fishAngle) {
	// 底部中心点的坐标
	PointF centerPoint = calculatePoint(startPoint, findCenterLength, fishAngle - 180);
	// 三角形底部两个点
	PointF leftPoint = calculatePoint(centerPoint, findEdgeLength, fishAngle + 90);
	PointF rightPoint = calculatePoint(centerPoint, findEdgeLength, fishAngle - 90);

	// 绘制三角形
	mPath.reset();
	mPath.moveTo(startPoint.x, startPoint.y);
	mPath.lineTo(leftPoint.x, leftPoint.y);
	mPath.lineTo(rightPoint.x, rightPoint.y);
	canvas.drawPath(mPath, mPaint);
}
```

绘制完的效果如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726045896171-8a6fc7a6-798c-4457-9f92-efa4ed820471.png)

### 9、锦鲤身体的绘制
根据前面对于鱼头、鱼鳍、鱼尾的绘制，再来绘制最后的身体已经不是很难得事情了，鱼身是从鱼头的位置到鱼尾大圆的位置，四个点A、B分别是鱼头偏移`90°`和`-90°`的情况下鱼头半径距离位置，C、D是鱼尾大圆偏移`90°`和`-90°`的情况下鱼尾大圆半径距离位置。

比较注意的点是画鱼身时需要使用贝塞尔曲线绘制，

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726046413615-12f8b36f-439e-4327-99fd-c61fb39d83e2.jpeg)

以AC为起始和终点找一个中间的控制点E绘制曲线

以BD为起始和终点找一个中间的控制点F绘制曲线

```java
// 画身体
makeBody(canvas, headPoint, bodyBottomCenterPoint, fishAngle);
```

```java
/
* 画鱼身
* @param headPoint
* @param bodyBottomCenterPoint
 */
private void makeBody(Canvas canvas, PointF headPoint, PointF bodyBottomCenterPoint, float fishAngle) {
	// 身体的四个点
	PointF topLeftPoint = calculatePoint(headPoint, HEAD_RADIUS, fishAngle + 90);
	PointF topRightPoint = calculatePoint(headPoint, HEAD_RADIUS, fishAngle - 90);
	PointF bottomLeftPoint = calculatePoint(bodyBottomCenterPoint, BIG_CIRCLE_RADIUS,
											fishAngle + 90);
	PointF bottomRightPoint = calculatePoint(bodyBottomCenterPoint, BIG_CIRCLE_RADIUS,
											 fishAngle - 90);

	// 二阶贝塞尔曲线的控制点
	PointF controlLeft = calculatePoint(headPoint, BODY_LENGTH * 0.56f,
										fishAngle + 130);
	PointF controlRight = calculatePoint(headPoint, BODY_LENGTH * 0.56f,
										 fishAngle - 130);

	// 画鱼身
	mPath.reset();
	mPath.moveTo(topLeftPoint.x, topLeftPoint.y);
	mPath.quadTo(controlLeft.x, controlLeft.y, bottomLeftPoint.x, bottomLeftPoint.y);
	mPath.lineTo(bottomRightPoint.x, bottomRightPoint.y);
	mPath.quadTo(controlRight.x, controlRight.y, topRightPoint.x, topRightPoint.y);
	mPaint.setAlpha(BODY_ALPHA);
	canvas.drawPath(mPath, mPaint);
}
```

找四个点的位置和划线不再赘述，其中EF两个控制点是以鱼头圆心为起始点偏移`130°`和`-130°`的情况下`BODY_LENGTH`的`0.56`倍距离的位置。

绘制效果如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726046663002-40707332-612b-4f0f-b6db-c66fe60b3246.png)

至此，一个静态的锦鲤就绘制完毕了

最终的代码如下

```java
package com.leo.lsn12;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.PointF;
import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class FishDrawable extends Drawable {
    private Paint mPaint;
    private Path mPath;

    // 身体之外的部分的透明度
    private final static int OTHER_ALPHA = 110;
    // 身体的透明度
    private final static int BODY_ALPHA = 160;

    // 鱼的重心（鱼身的中心）
    private PointF middlePoint;

    //鱼朝向的角度
    private float fishMainAngle = 90;

    public final static float HEAD_RADIUS = 150;

    // 鱼身的长度
    private final static float BODY_LENGTH = 3.2f * HEAD_RADIUS;

    private final static float FIND_FINS_LENGTH = 0.9f * HEAD_RADIUS;

    private final static float FINS_LENGTH = 1.3f * HEAD_RADIUS;

    // -------------鱼尾---------------
    // 尾部大圆的半径(圆心就是身体底部的中点)
    private final float BIG_CIRCLE_RADIUS = HEAD_RADIUS * 0.7f;
    // 尾部中圆的半径
    private final float MIDDLE_CIRCLE_RADIUS = BIG_CIRCLE_RADIUS * 0.6f;
    // 尾部小圆的半径
    private final float SMALL_CIRCLE_RADIUS = MIDDLE_CIRCLE_RADIUS * 0.4f;
    // --寻找尾部中圆圆心的线长
    private final float FIND_MIDDLE_CIRCLE_LENGTH = BIG_CIRCLE_RADIUS + MIDDLE_CIRCLE_RADIUS;
    // --寻找尾部小圆圆心的线长
    private final float FIND_SMALL_CIRCLE_LENGTH = MIDDLE_CIRCLE_RADIUS * (0.4f + 2.7f);
    // --寻找大三角形底边中心点的线长
    private final float FIND_TRIANGLE_LENGTH = MIDDLE_CIRCLE_RADIUS * 2.7f;

    public FishDrawable() {
        init();
    }

    private void init() {
        mPath = new Path();// 路径
        mPaint = new Paint();// 画笔
        mPaint.setStyle(Paint.Style.FILL);// 画笔类型，填充
        mPaint.setARGB(OTHER_ALPHA, 244, 92, 71);// 设置颜色
        mPaint.setAntiAlias(true);// 抗锯齿
        mPaint.setDither(true);// 防抖
        mPaint.setColor(Color.argb(OTHER_ALPHA,244,92,71));//设置颜色
        middlePoint = new PointF(4.19f * HEAD_RADIUS, 4.19f * HEAD_RADIUS);
    }

    @Override
    public void draw(@NonNull Canvas canvas) {
        float fishAngle = fishMainAngle;

        // 绘制鱼头
        PointF headPoint = calculatePoint(middlePoint, BODY_LENGTH / 2, fishAngle);
        canvas.drawCircle(headPoint.x, headPoint.y, HEAD_RADIUS, mPaint);


        // 鱼右鳍
        PointF rightFinsPoint = calculatePoint(headPoint, FIND_FINS_LENGTH, fishAngle - 110);
        makeFins(canvas, rightFinsPoint, fishAngle, true);

        // 鱼左鳍
        PointF leftFinsPoint = calculatePoint(headPoint, FIND_FINS_LENGTH, fishAngle + 110);
        makeFins(canvas, leftFinsPoint, fishAngle, false);

        // 身体的底部的大圆中心点
        PointF bodyBottomCenterPoint = calculatePoint(headPoint, BODY_LENGTH, fishAngle - 180);
        // 绘制节肢1
        makeSegment(canvas,bodyBottomCenterPoint,BIG_CIRCLE_RADIUS, MIDDLE_CIRCLE_RADIUS,
                FIND_MIDDLE_CIRCLE_LENGTH, fishAngle, true);

        // 绘制节肢2
        PointF middleCircleCenterPoint = calculatePoint(bodyBottomCenterPoint,
                FIND_MIDDLE_CIRCLE_LENGTH, fishAngle - 180);
        makeSegment(canvas,middleCircleCenterPoint,MIDDLE_CIRCLE_RADIUS, SMALL_CIRCLE_RADIUS,
                FIND_SMALL_CIRCLE_LENGTH, fishAngle, false);

        // 绘制大三角形
        makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH,
                BIG_CIRCLE_RADIUS, fishAngle);
        // 绘制小三角形
        makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH - 10,
                BIG_CIRCLE_RADIUS - 20, fishAngle);

        // 画身体
        makeBody(canvas, headPoint, bodyBottomCenterPoint, fishAngle);
    }

    /
     * 画鱼身
     * @param headPoint
     * @param bodyBottomCenterPoint
     */
    private void makeBody(Canvas canvas, PointF headPoint, PointF bodyBottomCenterPoint, float fishAngle) {
        // 身体的四个点
        PointF topLeftPoint = calculatePoint(headPoint, HEAD_RADIUS, fishAngle + 90);
        PointF topRightPoint = calculatePoint(headPoint, HEAD_RADIUS, fishAngle - 90);
        PointF bottomLeftPoint = calculatePoint(bodyBottomCenterPoint, BIG_CIRCLE_RADIUS,
                fishAngle + 90);
        PointF bottomRightPoint = calculatePoint(bodyBottomCenterPoint, BIG_CIRCLE_RADIUS,
                fishAngle - 90);

        // 二阶贝塞尔曲线的控制点
        PointF controlLeft = calculatePoint(headPoint, BODY_LENGTH * 0.56f,
                fishAngle + 130);
        PointF controlRight = calculatePoint(headPoint, BODY_LENGTH * 0.56f,
                fishAngle - 130);

        // 画鱼身
        mPath.reset();
        mPath.moveTo(topLeftPoint.x, topLeftPoint.y);
        mPath.quadTo(controlLeft.x, controlLeft.y, bottomLeftPoint.x, bottomLeftPoint.y);
        mPath.lineTo(bottomRightPoint.x, bottomRightPoint.y);
        mPath.quadTo(controlRight.x, controlRight.y, topRightPoint.x, topRightPoint.y);
        mPaint.setAlpha(BODY_ALPHA);
        canvas.drawPath(mPath, mPaint);
    }

    /
     * 画三角形
     * @param findCenterLength 顶点到底部的垂直线长
     * @param findEdgeLength 底部一半
     */
    private void makeTriangle(Canvas canvas, PointF startPoint,
                              float findCenterLength, float findEdgeLength, float fishAngle) {
        // 底部中心点的坐标
        PointF centerPoint = calculatePoint(startPoint, findCenterLength, fishAngle - 180);
        // 三角形底部两个点
        PointF leftPoint = calculatePoint(centerPoint, findEdgeLength, fishAngle + 90);
        PointF rightPoint = calculatePoint(centerPoint, findEdgeLength, fishAngle - 90);

        // 绘制三角形
        mPath.reset();
        mPath.moveTo(startPoint.x, startPoint.y);
        mPath.lineTo(leftPoint.x, leftPoint.y);
        mPath.lineTo(rightPoint.x, rightPoint.y);
        canvas.drawPath(mPath, mPaint);
    }

    /
     * 画节肢
     * @param bottomCenterPoint  梯形底部的中心点坐标（长边）
     * @param bigRadius 大圆的半径
     * @param smallRadius 小圆的半径
     * @param findSmallCircleLength 寻找梯形小圆的线长
     * @param hasBigCircle 是否有大圆
     */
    private void makeSegment(Canvas canvas, PointF bottomCenterPoint, float bigRadius,
                             float smallRadius, float findSmallCircleLength, float fishAngle,
                             boolean hasBigCircle) {
        // 梯形上底的中心点（短边）
        PointF upperCenterPoint = calculatePoint(bottomCenterPoint, findSmallCircleLength,
                fishAngle - 180);
        // 梯形的四个顶点
        PointF bottomLeftPoint = calculatePoint(bottomCenterPoint, bigRadius, fishAngle + 90);
        PointF bottomRightPoint = calculatePoint(bottomCenterPoint, bigRadius, fishAngle - 90);
        PointF upperLeftPoint = calculatePoint(upperCenterPoint, smallRadius, fishAngle + 90);
        PointF upperRightPoint = calculatePoint(upperCenterPoint, smallRadius, fishAngle - 90);

        if(hasBigCircle){
            // 绘制大圆
            canvas.drawCircle(bottomCenterPoint.x, bottomCenterPoint.y, bigRadius, mPaint);
        }
        // 绘制小圆
        canvas.drawCircle(upperCenterPoint.x, upperCenterPoint.y, smallRadius, mPaint);

        // 绘制梯形
        mPath.reset();
        mPath.moveTo(bottomLeftPoint.x, bottomLeftPoint.y);
        mPath.lineTo(upperLeftPoint.x, upperLeftPoint.y);
        mPath.lineTo(upperRightPoint.x, upperRightPoint.y);
        mPath.lineTo(bottomRightPoint.x, bottomRightPoint.y);
        canvas.drawPath(mPath, mPaint);
    }

    /
     * 绘制鱼鳍
     *
     * @param startPoint  起始点的坐标
     * @param fishAngle   鱼头相对于x坐标的角度
     * @param isRightFins
     */
    private void makeFins(Canvas canvas, PointF startPoint, float fishAngle, boolean isRightFins) {
        float controlAngle = 115;

        // 结束点
        PointF endPoint = calculatePoint(startPoint, FINS_LENGTH, fishAngle - 180);
        // 控制点
        PointF controlPoint = calculatePoint(startPoint, 1.8f * FINS_LENGTH,
                isRightFins ? fishAngle - controlAngle : fishAngle + controlAngle);

        mPath.reset();
        mPath.moveTo(startPoint.x, startPoint.y);
        // 二阶贝塞尔曲线
        mPath.quadTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);

        canvas.drawPath(mPath, mPaint);

    }

    /
     * 求对应点的坐标 -- 知道起始点，知道鱼头的角度，知道两点间的距离，就可以算出想要的点的坐标
     *
     * @param startPoint 起始点的坐标
     * @param length     两点间的长度
     * @param angle      鱼头相对于x坐标的角度
     * @return
     */
    public static PointF calculatePoint(PointF startPoint, float length, float angle) {
        // angle 角度（0度~360度）  三角函数 -- 弧度
        float deltaX = (float) (Math.cos(Math.toRadians(angle)) * length);
        float deltaY = (float) (-Math.sin(Math.toRadians(angle)) * length);
        return new PointF(startPoint.x + deltaX, startPoint.y + deltaY);
    }

    /
     * 设置透明度的方法
     * @param alpha
     */
    @Override
    public void setAlpha(int alpha) {
        // 设置Drawable的透明度，一般情况下将此alpha设置给Paint
        mPaint.setAlpha(alpha);
    }

    // 设置颜色过滤器

    /
     * 设置了一个颜色过滤器，那么在绘制出来之前，被绘制内容的每一个像素都会被颜色过滤器改变
     * @param colorFilter 颜色过滤器，为null时移除颜色过滤器
     */
    @Override
    public void setColorFilter(@Nullable ColorFilter colorFilter) {
        // 设置颜色过滤器，一般情况下将此值设置给Paint
        mPaint.setColorFilter(colorFilter);
    }

    /
     * 这个值，可以根据setAlpha中设置的值进行调整。比如，alpha == 0时设置为 PixelFormat.TRANSPARENT.
     * 在alpha == 255 时设置为 PixelFormat.OPAQUE。在其他时候设置为 PixelFormat.TRANSLUCENT
     * PixelFormat.OPAQUE : 完全不透明，遮盖在他下面的所有内容
     * PixelFormat.TRANSPARENT : 透明，完全不显示任何东西
     * PixelFormat.TRANSLUCENT : 只有绘制的地方才覆盖地下的内容
     * @return
     */
    @Override
    public int getOpacity() {
        // 只有绘制的地方才覆盖底下的内容
        return PixelFormat.TRANSLUCENT;
    }

    // 如果ImageView的宽高为wrap_content,则获取这个值
    @Override
    public int getIntrinsicHeight() {
        //设置的中心点是4.19f*HEAD_RADIUS,即一半宽高，所以宽高是8.38f*HEAD_RADIUS
        return (int) (8.38f * HEAD_RADIUS);
    }

    @Override
    public int getIntrinsicWidth() {
        return (int) (8.38f * HEAD_RADIUS);
    }
}
```

## 二、原地摆动
原地摆尾实际就是动画的改变角度，将鱼头的角度向两边改变下角度，这里用到了我们之前讲过的属性动画。初始化设置属性动画

```java
// currentValue * 1.2=  360 * 整数  currentValue * 1.5= 360 * 整数
// currentValue = 300 --- currentValue = 240
// 300/4/5/3 = 5 和 240/4/5/3 = 4 的最小公倍速 ---》 5* 240 -- 4*300 == 1200

//创建一个ValueAnimator对象，将动画的开始值设置为-1，结束值设置为1
ValueAnimator valueAnimator = ValueAnimator.ofFloat(-1, 1);
valueAnimator.setDuration(1000);// 设置周期1s
valueAnimator.setRepeatMode(ValueAnimator.REVERSE); // 设置循环模式， 先从-1到1，再从1到-1
valueAnimator.setRepeatCount(ValueAnimator.INFINITE); // 循环次数，无限制
valueAnimator.setInterpolator(new LinearInterpolator());//设置动画的插值器为LinearInterpolator，动画以匀速进行
valueAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
	@Override
	public void onAnimationUpdate(ValueAnimator animation) {
		currentValue = (float) animation.getAnimatedValue();
		invalidateSelf();
	}
});
valueAnimator.start();
```

draw时设置的角度随者属性动画的改变而周期变化

```java
float fishAngle = fishMainAngle + currentValue * 30;
```

效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055082050-f32315ff-987f-4fc3-bdeb-6d93eb0964bd.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055090805-d0c519ec-25b9-4e79-8761-0b657d189c98.png)

虽然可以鱼可以摆动了，但是摆动的像个钟摆，不好看。我们想实现的效果中鱼头的摆动和鱼尾都是不一样的，鱼头摆动的幅度小且慢，鱼尾摆动的幅度大且快，

如何实现那？在设置一个属性动画吗？可以，但是不建议这样做，

我们的摆动是周期性摆动的，说到周期如果往数学方面上想应该很容易想到三角函数，

| 正弦函数 |
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055280297-d56a19bc-f8a4-4a7b-82b2-3d34948a9fc8.png) |
| --- | --- |
| 余弦函数 |
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055294623-2100c97b-7969-4897-8ca8-f5bf260bf798.png) |
| 正切函数 |
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055311406-7ca22469-9f89-4fe7-be09-418cffd82ca5.png) |
| 反余弦 |
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726055301245-833a19df-3af0-405f-b35c-4f592e9c8a4c.png) |


三角函数的变化都是周期性的，而且y值都是在`[-1，1]`变化，在我们刚才的设置里，动画的开始值设置为-1，结束值设置为1，假如我们将开始和结束设置为0和1000，周期我们也设置为`5*1000`，此时将属性动画的值看成角度，利用三角函数周期的原理来设置fishAngle

```java
float fishAngle = (float) (fishMainAngle +
                Math.sin(Math.toRadians(currentValue * 1.2)) * 4);
```

使用正弦函数将获取的`currentValue`转化为`[-1,1]`之间的数然后`正弦值*4`获得需要摆动的角度。

`currentValue * 1.2`是正弦变化的频率。

绘制节肢的代码内也使用正弦计算得到segmentAngle，并将之前的fishAngle全部替换为segmentAngle。

```java
private void makeSegment(Canvas canvas, PointF bottomCenterPoint, float bigRadius,
						 float smallRadius, float findSmallCircleLength, float fishAngle,
						 boolean hasBigCircle) {
	float segmentAngle = (float) (fishAngle +
								  Math.sin(Math.toRadians(currentValue * 1.5)) * 35);

	// 梯形上底的中心点（短边）
	PointF upperCenterPoint = calculatePoint(bottomCenterPoint, findSmallCircleLength,
											 segmentAngle - 180);
	// 梯形的四个顶点
	PointF bottomLeftPoint = calculatePoint(bottomCenterPoint, bigRadius, segmentAngle + 90);
	PointF bottomRightPoint = calculatePoint(bottomCenterPoint, bigRadius, segmentAngle - 90);
	PointF upperLeftPoint = calculatePoint(upperCenterPoint, smallRadius, segmentAngle + 90);
	PointF upperRightPoint = calculatePoint(upperCenterPoint, smallRadius, segmentAngle - 90);

	//......

}
```

效果如图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726057668362-35e8f6fe-ce09-4dea-9db4-a9133e1fcca7.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726057778969-e4b48227-f9f7-4f5d-b32c-478efba2ba24.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726057795425-0967a1f6-ba7c-48f4-ab10-82eee071f28a.png)

发现节肢1和节肢2已经分离了，这也不符合我们的想法。这是在之前的代码里节肢2计算使用的起始点是按照节肢1的中圆位置设置的，但是现在节肢1摆动后中圆的圆心变化了，但是节肢2依然使用的原来的中圆圆心作为起始点去计算的，所以这里要使用变化后的点，即`makeSegment`要返回相对小圆的位置。

```java
@Override
public void draw(@NonNull Canvas canvas) {
	// 身体的底部的大圆中心点
	PointF bodyBottomCenterPoint = calculatePoint(headPoint, BODY_LENGTH, fishAngle - 180);
	// 绘制节肢1
	PointF middleCircleCenterPoint = makeSegment(canvas, bodyBottomCenterPoint, BIG_CIRCLE_RADIUS, MIDDLE_CIRCLE_RADIUS,
												 FIND_MIDDLE_CIRCLE_LENGTH, fishAngle, true);

	// 绘制节肢2
	//        PointF middleCircleCenterPoint = calculatePoint(bodyBottomCenterPoint,
	//                FIND_MIDDLE_CIRCLE_LENGTH, fishAngle - 180);
	makeSegment(canvas, middleCircleCenterPoint, MIDDLE_CIRCLE_RADIUS, SMALL_CIRCLE_RADIUS,
				FIND_SMALL_CIRCLE_LENGTH, fishAngle, false);
}
```

```java
private PointF makeSegment(Canvas canvas, PointF bottomCenterPoint, float bigRadius,
                             float smallRadius, float findSmallCircleLength, float fishAngle,
                             boolean hasBigCircle) {

	//......

	return upperCenterPoint;
}
```

效果如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726058226653-18827739-9772-46c9-bff7-8579e28ae3c3.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726058242633-e8e5a286-0358-4bc6-ab1b-440a08f9aca6.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726058234706-0c560705-28c5-4117-9f60-04f05cb07cdb.png)

虽然没有节肢分离，但是按我们设想的动画节肢1和节肢2应该是节肢1摆动的幅度要比节肢2摆动的幅度小一点，而且方向应该不同才更加和谐，现在还是同向，继续修改。

我们在节肢摆动的时候用到了sin，现在想让节肢1和节肢2摆动不同，自然想到了cos，让节肢1和节肢2一个使用sin一个使用cos，就可以实现方向相反的摆动，再改变两个摆动的角度就可以，那么节肢1和节肢2谁用sin使用cos哪？在我们的理解中应该是节肢1摆动起来带动节肢2的摆动，这样子看起来才更和谐，所以我们节肢1使用cos，节肢2使用sin,当然也可以试一下反过来使用，但是效果会发现像是节肢2先变动，节肢1再摆动，很别扭。

```java
private PointF makeSegment(Canvas canvas, PointF bottomCenterPoint, float bigRadius,
						   float smallRadius, float findSmallCircleLength, float fishAngle,
						   boolean hasBigCircle) {
	// 节肢摆动的角度
	// 节肢1 和 节肢2 哪个用sin  哪个用 cos --》 随便1
	// 节肢1 用 cos
	float segmentAngle;
	if (hasBigCircle) {
		segmentAngle = (float) (fishAngle +
								Math.cos(Math.toRadians(currentValue * 1.5)) * 15);
	} else {
		segmentAngle = (float) (fishAngle +
								Math.sin(Math.toRadians(currentValue * 1.5)) * 35);
	}
}
```

在我们现在的摆动里，因为属性动画设置的是`valueAnimator.setRepeatMode(ValueAnimator.REVERSE)`导致他会正向摆动一次，再逆向摆动一次，如下图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726103720218-63adcff2-569b-42ce-b5fc-a4c3260c83e6.png)

并且每次换方向都会出现抖动。这是因为我们的周期和我们设置的正弦余弦函数不一样，导致不是连续的360°的变化，出现了角度的跳跃。

所以循环模式要换成`RESTART`。

我们的属性动画设置的值是[0,1000]即`0°`到`1000°`，我们要设置为`360°`的倍数才能保证换算为弧度后正弦余弦的周期可以衔接上，而不是突然变化。所以我们按如下改动属性动画的设置

```java
ValueAnimator valueAnimator = ValueAnimator.ofFloat(0, 360);
valueAnimator.setDuration(5*1000);
```

但是我们发现这样去运行依然会出现抖动，为什么？我们已经让属性动画的值从`0°`变化到`360°`了，依然还是出现了抖动，这是因为我们在使用属性动画的值去计算弧度时都乘以了一个系数，导致乘完系数后的角度不是360的整数倍数了，我们在鱼头的摆动中角度系数如下：

`float fishAngle = (float) (fishMainAngle + Math.sin(Math.toRadians(currentValue * 1.2)) * 4)`

鱼头的摆动使用了1.2倍的系数。

而我们在鱼尾的摆动里使用的角度系数是：

`float triangleAngle = (float) (fishAngle + Math.sin(Math.toRadians(currentValue * 1.5)) * 35);`

`segmentAngle = (float) (fishAngle + Math.cos(Math.toRadians(currentValue * 1.5)) * 15);`

`segmentAngle = (float) (fishAngle + Math.sin(Math.toRadians(currentValue * 1.5)) * 35);`

鱼尾的节肢和尾鳍都是使用的`1.5`倍的系数。

所以首先要知道我们在`1.2`和`1.5`系数的基础上，属性动画的值最小要设置到多少，才能让角度转为弧度后正弦余弦的变化不会跳跃，即如何设置一个值乘以`1.2`和`1.5`倍系数后的角度依然同时符合360°的倍数。

`currentValue1*1.2 = 360*整数，即currentValue1 = 300*整数`

`currentValue2*1.5 = 360*整数，即currentValue2 = 240*整数`

所以对于节肢1来说，`300乘以整数`的值就足够它摆动实现360°的循环

而对于节肢2来说，`240乘以整数`的值就足够它摆动实现360°的循环

那么对于`currentValue1`和`currentValue2`的最小公倍数即240和300的最小公倍数是多少？

很容易计算是1200，所以当值是[0,1200]时，节肢1和节肢2都可以实现[0,360]角度的变化，并且没有突然的变化保证角度是一直连续的。

```java
ValueAnimator valueAnimator = ValueAnimator.ofFloat(0, 1200);
valueAnimator.setDuration(5*1000);
valueAnimator.setRepeatMode(ValueAnimator.RESTART);
```

如上代码，将角度值设置为[0,1200]，周期拉长到5s，循环模式也更换为RESTART，再次运行后效果就正常了，没有了抖动也不会出现正向摆一会逆向摆一会的现象。

节肢的摆动结束后，我们再来设置鱼尾三角形的摆动，要跟随节肢2的摆动而摆动。即摆动时应该和节肢2角度设置是一样的。

```java
private void makeTriangle(Canvas canvas, PointF startPoint,
						  float findCenterLength, float findEdgeLength, float fishAngle) {
	// 三角形鱼尾的摆动角度需要跟着节肢2走
	float triangleAngle = (float) (fishAngle +
								   Math.sin(Math.toRadians(currentValue * 1.5)) * 35);
}
```

三角形鱼尾巴可以跟随节肢2摆动了，现在我们想实现一个鱼尾尾鳍的变化效果，例如我们这里实现一个尾鳍大小变化

原本我们是这样实现的，

```java
// 绘制大三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH,
			 BIG_CIRCLE_RADIUS, fishAngle);
// 绘制小三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH - 10,
			 BIG_CIRCLE_RADIUS - 20, fishAngle);
```

设置尾鳍的大小，即改变传入的BIG_CIRCLE_RADIUS即可，我们让尾鳍的变化跟随鱼尾的摆动出现大小变化，与节肢2的摆动相同，只不过这里是尾鳍改变的是尾鳍的宽，如下

```java
float findEdgeLength = (float) Math.abs(Math.sin(Math.toRadians(currentValue * 1.5))
										* BIG_CIRCLE_RADIUS);
// 绘制大三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH,
			 findEdgeLength, fishAngle);
// 绘制小三角形
makeTriangle(canvas, middleCircleCenterPoint, FIND_TRIANGLE_LENGTH - 10,
			 findEdgeLength - 20, fishAngle);
```

至此，我们的原地摆动就做完了。

## 三、交互游动
### 1、界面布局
首先拆建xml

```java
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/activity_main"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <com.example.study12.FishRelativeLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
```

首先自定义一个FishRelativeLayout继承RelativeLayout

```java
public class FishRelativeLayout extends RelativeLayout {

    private ImageView ivFish;
    private FishDrawable fishDrawable;

    public FishRelativeLayout(Context context) {
        this(context,null);
    }

    public FishRelativeLayout(Context context, AttributeSet attrs) {
        this(context, attrs,0);
    }

    public FishRelativeLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(Context context) {
        ivFish = new ImageView(context);
        LayoutParams layoutParams = new LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ivFish.setLayoutParams(layoutParams);

        fishDrawable = new FishDrawable();
        ivFish.setImageDrawable(fishDrawable);

        addView(ivFish);
    }
}
```

### 2、点击的水波纹效果
手指按下的位置，在手指的位置画一个圆，带有动画效果，圆从小到大变化，透明度也不断变化，慢慢的变透明直到消失。

初始化时创建画笔。

```java
private void init(Context context) {

	//......

	mPaint = new Paint();
	mPaint.setAntiAlias(true);
	mPaint.setDither(true);
	mPaint.setStyle(Paint.Style.STROKE);
	mPaint.setStrokeWidth(8);//绘制圆圈

}
```

重写点击事件处理水波纹效果。

```java
private float touchX;
private float touchY;
private void init(Context context) {

	//......
	// 因为FishRelativeLayout是容器，不会执行 onDraw，设置标志位，让onDraw执行
	setWillNotDraw(false);

}
@Override
public boolean onTouchEvent(MotionEvent event) {
    switch (event.getAction()) {
        case MotionEvent.ACTION_DOWN:
            // 获取手指按下的 x，y坐标，作为圆心的point
            touchX = event.getX();
            touchY = event.getY();
            invalidate();
            break;
        default:
            break;
    }
    return super.onTouchEvent(event);
}

// 会执行吗？？
@Override
protected void onDraw(Canvas canvas) {
	canvas.drawCircle(touchX, touchY, 150, mPaint);
}
```

思路就是重写onTouchEvent方法，获取点击的x,y坐标作为圆心的point，然后在draw时候去绘制圆圈，但是这里有个点需要注意，因为FishRelativeLayout是容器，是不执行onDraw方法的，所以我们要设置`setWillNotDraw(false);`让onDraw执行。

效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726107887061-49ccf697-a3cc-4123-ba74-76be2ecca59f.png)

但是发现运行后什么都没有操作时就已经绘制了一个圆，


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726108031430-95b98d4e-6d4a-4ed2-888e-275e8bdcf7af.png)

所以需要做修改，让touchx和touchy在开始默认为-1，只有当按下后touchx>-1,touchy>-1才绘制

```java
private float touchX = -1;
private float touchY = -1;
@Override
protected void onDraw(Canvas canvas) {
    if (touchX >= 0 && touchY >= 0) {
        canvas.drawCircle(touchX, touchY, 150, mPaint);
    }
}
```

现在点击后绘制圆圈可以了，但是并没有水波纹效果和消失，所以我们需要使用属性动画去设置。

```java
//水波纹透明度
private int alpha;
// 半径的变化系数
private float rippleFactors;
@Override
public boolean onTouchEvent(MotionEvent event) {
	switch (event.getAction()) {
		case MotionEvent.ACTION_DOWN:
			// 获取手指按下的 x，y坐标，作为圆心的point
			touchX = event.getX();
			touchY = event.getY();
			ObjectAnimator objectAnimator = ObjectAnimator.ofFloat(this,
					"ripple",0,1f).setDuration(1000);
			objectAnimator.start();
			break;
		default:
			break;
	}
	return super.onTouchEvent(event);
}
public void setRipple(float ripple) {
	alpha = (int) (100 * (1 - ripple));
	this.rippleFactors = ripple;

	invalidate();
}
@Override
protected void onDraw(Canvas canvas) {
	if (touchX >= 0 && touchY >= 0) {
		mPaint.setAlpha(alpha);
		canvas.drawCircle(touchX, touchY, rippleFactors * 150, mPaint);
	}
}
```

首先创建两个变量alpha和rippleFactors，一个代表水波纹的透明程度，一个代表水波纹圆圈的半径系数，

在点击时创建一个属性动画，控制名为`ripple`的属性从0到1变化，在`setRipple(float ripple)`方法中将变化的ripple值赋值给变量rippleFactors，同时根据当前圆圈的大小情况设置透明度，当圆圈最大时透明度为0，代表完全透明。

效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726109189393-4c0c584d-ebc7-45a6-80de-0af06a8dfa3c.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726109201803-67c4b3ea-d64c-4fbf-91e0-eda91ccbd4d8.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726109219897-610c76d2-0f89-4973-b419-7e6ff8026658.png)

### 3、实现小鱼移动
#### (1) 简单移动
下面我们开始绘制小鱼的游动，首先，我们先不考虑小鱼的转向等效果，简单的让小鱼由原来的位置移动到点击的位置，代码如下

```java
@Override
public boolean onTouchEvent(MotionEvent event) {
	switch (event.getAction()) {
		case MotionEvent.ACTION_DOWN:
			// 获取手指按下的 x，y坐标，作为圆心的point
			touchX = event.getX();
			touchY = event.getY();

			ObjectAnimator objectAnimator = ObjectAnimator.ofFloat(this,
					"ripple", 0, 1f).setDuration(1000);
			objectAnimator.start();

			makeTrail();
			break;
		default:
			break;
	}

	return super.onTouchEvent(event);
}

private void makeTrail() {
	//设置x方向平移距离
	ivFish.setTranslationX(touchX - ivFish.getLeft());
	//设置y方向平移的距离
	ivFish.setTranslationY(touchY - ivFish.getTop());

}
```

如上代码运行后，点击屏幕后，小鱼会直接跳到点击的位置，但是因为我们是整体平移了`touchX - ivFish.getLeft()`和`touchY - ivFish.getTop()`的距离，所以图片的左上角位置会平移到点击的位置，而我们希望鱼的中心点移动到点击的位置，所以平移之后还需要将图片的中心点平移到图片的左上角，首先要先获取到图片的中心点即之前静态绘制时的`middlePoint`。

```java
public PointF getMiddlePoint() {
    return middlePoint;
}
```

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	//直接跳转到手指按下的位置
	ivFish.setTranslationX(touchX - ivFish.getLeft() - fishImageViewMiddle.x);
	ivFish.setTranslationY(touchY - ivFish.getTop() - fishImageViewMiddle.y);

}
```

fishImageViewMiddle.x得到的值就是中心点在图片中的x位置，fishImageViewMiddle.y得到的值就是中心点在图片中的y位置，

touchX - ivFish.getLeft()，touchY - ivFish.getTop()是图片的左上角位置，所以需要在向左上平移fishImageViewMiddle.x和 fishImageViewMiddle.y距离，将鱼的中心点移动到点击的位置。

#### (2) 缓慢沿着路线移动
实现慢慢移动到点击位置的动画效果

使用属性动画实现，属性动画 -- ValueAnimator(值的改变，与属性无关),ObjectAnimator(属性动画)

#### (3) 使用ValueAnimator实现
首先是点击后，小鱼的位置移动到点击位置，设置两个属性动画，一个控制x方向的平移，一个控制y方向的平移，平移的值的变化就是小鱼原来的位置的x,y坐标，变化到移动到点击位置的坐标。当每次收到动画更新时都去更新当前小鱼的位置，代码如下

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 小鱼的起始点 上一次平移后的位置

	// x方向的平移
	ValueAnimator valueAnimatorX = ValueAnimator.ofFloat(ivFish.getTranslationX(),
			touchX - ivFish.getLeft() - fishImageViewMiddle.x);
	valueAnimatorX.setDuration(2000);
	valueAnimatorX.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
		@Override
		public void onAnimationUpdate(ValueAnimator animation) {
			float currentValue = (float) animation.getAnimatedValue();
			ivFish.setTranslationX(currentValue);
		}
	});
	valueAnimatorX.start();

	// y方向的平移
	ValueAnimator valueAnimatorY = ValueAnimator.ofFloat(ivFish.getTranslationY(),
			touchY - ivFish.getTop() - fishImageViewMiddle.y);
	valueAnimatorY.setDuration(2000);
	valueAnimatorY.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
		@Override
		public void onAnimationUpdate(ValueAnimator animation) {
			float currentValue = (float) animation.getAnimatedValue();
			ivFish.setTranslationY(currentValue);
		}
	});
	valueAnimatorY.start();

}
```

#### (4) 使用ObjectAnimator实现--方法1
使用setTranslationX,setTranslationY方式,不适用valueAnimator的方法，而是直接用ObjectAnimator通过反射的方式改变translationX和translationY的值，因为View中存在translationX和translationY的属性并且实现了set方法，用法如下

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 小鱼的起始点 上一次平移后的位置

	ObjectAnimator objectAnimator1 = ObjectAnimator.ofFloat(ivFish, "translationX",
															ivFish.getTranslationX(), touchX - ivFish.getLeft() - fishImageViewMiddle.x);
	objectAnimator1.setDuration(2000);
	objectAnimator1.start();

	ObjectAnimator objectAnimator2 = ObjectAnimator.ofFloat(ivFish, "translationY",
															ivFish.getTranslationY(), touchY - ivFish.getTop() - fishImageViewMiddle.y);
	objectAnimator2.setDuration(2000);
	objectAnimator2.start();

}
```

`ObjectAnimator.ofFloat()` 方法的基本用法如下：

`ObjectAnimator animator = ObjectAnimator.ofFloat(target, propertyName, startValue, endValue);`

+ `target` 是你想要动画化的对象。
+ `propertyName` 是你想要动画化的属性的名称，比如 "translationX"、"scaleX"、"alpha" 等。
+ `startValue` 是动画开始时的值。
+ `endValue` 是动画结束时的值。

使用ObjectAnimator比ValueAnimator代码简便一些，实现的效果一样。

`ObjectAnimator.ofFloat(ivFish, "translationX",ivFish.getTranslationX(), touchX - ivFish.getLeft() - fishImageViewMiddle.x);`的含义就是对ivFish对象的translationX属性，设置从`ivFish.getTranslationX()`到`touchX - ivFish.getLeft() - fishImageViewMiddle.x`的变化，当变化时，会更新translationX属性的值。

#### (5) 使用ObjectAnimator实现--方法2
使用setX,setY

```java
public void setX(float x) {
	setTranslationX(x - mLeft);
}

public void setY(float y) {
	setTranslationY(y - mTop);
}
```

可以看到，View的setX,setY方法最终还是调用的setTranslationX和setTranslationY，只不过setX,setY设置的是点的坐标，而setTranslationX和setTranslationY是设置的移动距离，如果我们使用setX,setY，就需要自己在设置动画开始和结束的值时设置点击后图片中心点在点击位置时，图片左上角的位置，(使用setTranslationX和setTranslationY时我们设置的是touchX - - ivFish.getLeft() - fishImageViewMiddle.x，因为setX会自己去掉getLeft，所以只需要设置touchX - fishImageViewMiddle.x就可以)代码如下：

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 小鱼的起始点 上一次平移后的位置

	ObjectAnimator objectAnimator1 = ObjectAnimator.ofFloat(ivFish, "x",
															ivFish.getX(), touchX - fishImageViewMiddle.x);
	objectAnimator1.setDuration(2000);
	objectAnimator1.start();

	ObjectAnimator objectAnimator2 = ObjectAnimator.ofFloat(ivFish, "y",
															ivFish.getY(), touchY - fishImageViewMiddle.y);
	objectAnimator2.setDuration(2000);
	objectAnimator2.start();

}
```

#### (6) 使用ObjectAnimator实现--方法3
通过setX，setY，path实现。

上面ObjectAnimator的方法1和2都需要单独设置x和y的移动，有什么更简便的方法吗？有的，ObjectAnimator.ofFloat还有另一种使用方式，

> `public static ObjectAnimator ofFloat(Object target, String xPropertyName, String yPropertyName, Path path)`
>
> ObjectAnimator.ofFloat() 方法的重载版本，可以对对象的两个属性进行动画处理，并且这两个属性的值会随着一个路径（`Path`）的变化而变化。通常用于实现沿着复杂路径的动画效果。
>
> 参数说明
>
> + target: 要动画化的对象。
> + xPropertyName: 要动画化的属性名称，该属性应该是一个浮点数（float），用于控制对象沿 X 轴的位置。
> + yPropertyName: 要动画化的属性名称，该属性应该是一个浮点数（float），用于控制对象沿 Y 轴的位置。
> + path: 定义动画路径的 `Path` 对象。
>

代码实现如下：

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 小鱼的起始点 上一次平移后的位置

	Path path = new Path();
	path.moveTo(ivFish.getX(), ivFish.getY());
	path.lineTo(touchX - fishImageViewMiddle.x,touchY - fishImageViewMiddle.y);
	ObjectAnimator objectAnimator = ObjectAnimator.ofFloat(ivFish, "x", "y", path);
	objectAnimator.setDuration(2000);
	objectAnimator.start();

}
```

以上几种方法最终实现的效果都是一样的，但是明显最后一种是最简便的，而且我们不光要实现移动，还有复杂的路径和旋转等效果，选择使用path的这种方法更适合，后面会讲到。

### 4、通过贝塞尔曲线实现小鱼的灵活游动
上面我们有说过使用path参数的ObjectAnimator.ofFloat重载方法，可以通过path使用贝塞尔曲线绘制灵活的路线动画。

我们使用三阶贝塞尔曲线来绘制复杂的不规则路径绘制，

三阶贝塞尔需要四个点的位置，这四个点在我们的示例中分别是什么？


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726122731015-0db1c3b0-327a-4f82-b201-bad7ec529cbf.png?x-oss-process=image%2Fformat%2Cwebp)

如上图，在我们示例中，一个明确的位置是鱼的重心O点，手指点击处B点，这也是我们的起始点和终点，而绘制三阶贝塞尔曲线还需要两个控制点，如图，我们还有一个现成的点位鱼头圆心A，当这三个点确认后我们发现通过鱼头圆心A、鱼身重心O、点击处B我们就可以确定一个特征三角形，而通过三角形内角AOB的大小就知道鱼身需要向左还是向右转弯了。

最后一个控制点，我们规定∠AOB的角平分线上的某个点C作为第二个控制点。所以四个点就找全了。

现在具体去求出这四个点：

其中ABO三个点的位置容易计算，都是我们之前用到过的，代码如下：

```java
// 起始点
PointF fishMiddle = new PointF(ivFish.getX() + fishImageViewMiddle.x,
							   ivFish.getY() + fishImageViewMiddle.y);
// 鱼头的坐标 -- 相对于 水池的 坐标 -- 控制点1
PointF fishHead = new PointF(ivFish.getX() + fishDrawable.getHeadPoint().x,
							 ivFish.getY() + fishDrawable.getHeadPoint().y);
// 点击位置 -- 结束点
PointF touch = new PointF(touchX, touchY);
```

难算的就是我们角AOB的角度和C点位置，

> 求三角形的内角一般可以通过下列方式
>
> 第一种计算夹角 余弦定理
>
> 在数学中在直到三条边长时，计算夹角的公式
>
> 通过余弦定理可知
>
>
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726124545300-907901b1-1fa5-46bc-b75e-748cc8059bc8.png)
>
> 所以在我们例子中
>
> `|AO|*|AO| = |AB|*|AB| + |BO|*|BO| - 2*|AB|*|BO|*cosAOB`
>
> 所以
>
> `cosAOB =  (|AB|*|AB| + |BO|*|BO|  - |AO|*|AO|) / (2*|AB|*|BO|)`
>
> 再通过反余弦求出`∠AOB`的大小
>
> 第二种计算夹角 通过向量
>
> 已知向量a=(x1,y1)，b=(x2,y2)，向量夹角位θ
>
> `a·b=|a|*|b|cosθ`, 这个是向量的内积，又叫数量积，又叫点积，0° ≤ θ ≤ 180°
>
> `a·b = x1x2+y1y2`
>
> `axb = |a|*|b|sinθ`，这个是向量的外积，又叫向量积，又叫叉积，-90° ≤ θ ≤ 90°
>
> `axb = x1y2 - x2y1`
>
> 所以我们可以通过`cosθ`确定角度的大小，通过`sinθ`(右手法则大拇指朝上，四指向左弯曲握拳则`sinθ`为正数)确定向量a到向量b是向左侧弯曲还是右侧弯曲。
>
>
>
> a，b向量积`axb = |a|*|b|*sinθ`
>
> 则有`sinθ = (axb) / (|a|*|b|)`
>
> `sinθ = (x1y2-x2y1) / (|a|*|b|)`
>
>
>
> a，b数量积`a·b = |a|*|b|*cosθ`
>
> 则有 `cosθ = (a·b) / (|a|*|b|)`
>
> a，b代表向量，|a|，|b|代表向量a，b的长度。
>
>
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726125064215-0621998b-d277-45fa-9839-9acfd432de5f.png)
>

> 在我们的示例中，
>
> `a=(Ax-Ox,Ay-Oy)，b=(Bx-Ox,By-Oy)`
>
> `|a| = Math.sqrt((A.x - O.x) * (A.x - O.x) + (A.y - O.y) * (A.y - O.y))`
>
> `|b| = Math.sqrt((B.x - O.x) * (B.x - O.x) + (B.y - O.y) * (B.y - O.y))`
>
> 将a，b，|a|，|b|的值代入公式即可求出`cosθ`,`sinθ`,的大小，再通过反余弦得到夹角大小,`sinθ`正负确认向量b是向量a向左侧还是右侧转向。
>


所以我们要在代码中写一个计算三角形的内角的函数。

```java
/
 * 向量点乘a·b,
 * a·b = |a| * |b| * cosθ    (0° ≤ θ ≤ 180°)
 * a·b = x1x2+y1y2
 * 向量叉乘
 * axb = |a| * |b| * sinθ    (-90° ≤ θ ≤ 90°)
 * axb = x1y2 - x2y1
 * 通过cosθ确定角度的大小
 * 通过sinθ确定向量a到向量b方向的转向是向左侧弯曲还是右侧弯曲
 * (右手法则大拇指朝上，四指向左弯曲握拳则sinθ为正数)
 * @param O 三角形顶点O,鱼重心位置
 * @param A 三角形顶点A,鱼头圆心位置
 * @param B 三角形顶点B,点击处位置
 * @return float 转动的角度，当向左侧转动角度为负数，向右转动角度为正数
 */
public static float includedAngle(PointF O, PointF A, PointF B) {
	// OA的长度
	float OALength = (float) Math.sqrt((A.x - O.x) * (A.x - O.x) + (A.y - O.y) * (A.y - O.y));
	// OB的长度
	float OBLength = (float) Math.sqrt((B.x - O.x) * (B.x - O.x) + (B.y - O.y) * (B.y - O.y));
	// OA·OB=(Ax-Ox)*(Bx-Ox)+(Ay-Oy)*(By-Oy)
	float AOB = (A.x - O.x) * (B.x - O.x) + (A.y - O.y) * (B.y - O.y);
	// cosAOB = (OA·OB)/(|OA|*|OB|)
	float cosAOB = AOB / (OALength * OBLength);

	// 角度 -- 反余弦
	float angleAOB = (float) Math.toDegrees(Math.acos(cosAOB));

	// 按照向量积公式，axb = |a| * |b| * sinθ , axb = x1y2-x2y1
    // 求sinθ正负只需要计算x1y2-x2y1即可，|a| * |b|永远为正
    // sinθ为正，B点在OA左侧，sinθ为负B点在OA右侧
	float direction = (A.y - B.y) / (A.x - B.x) - (O.y - B.y) / (O.x - B.x);

	// 点击在鱼头延长线上 -- angleAOB == 0 ---点击在鱼尾延长线上 angleAOB 180
	if(direction == 0){
		if (AOB >= 0) {
			return 0;
		} else
			return 180;
	} else {
		if (direction > 0) {
			return -angleAOB;
		} else {
			return angleAOB;
		}
	}
}
```

参数传入O,A,B的位置坐标可以计算处∠AOB的角度，除了算出角度外，我们还需要知道是往左侧旋转∠AOB的角度还是往右侧旋转，另外特殊情况下往鱼头延长线点击和鱼尾延长线点击也要特别处理，计算如上。

然后再回到计算位置的代码，寻找我们的第二个控制点

```java
float angle = includedAngle(fishMiddle, fishHead, touch);
float delta = includedAngle(fishMiddle, new PointF(fishMiddle.x + 1, fishMiddle.y), fishHead);
// 控制点2
PointF controlPoint = fishDrawable.calculatePoint(fishMiddle,
												  FishDrawable.HEAD_RADIUS * 1.6f, angle / 2 + delta);
```

首先通过fishMiddle, fishHead, touch三个点得到∠AOB的夹角


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726143238421-535f92ca-07cd-4998-8672-c0f674602286.png)

假设鱼头圆心A，鱼重心O，点击处B如图所示，则控制点C的位置应该是O点偏移θ角度的情况下1.6R距离的点。

在之前的绘制鱼头鱼鳍的时候，我们根据鱼重心点`middlePoint`和鱼朝向的角度`fishMainAngle`(鱼头朝向右为0°,往上转180°，往下转180°)以及鱼头圆心和`middlePoint`之间的距离计算出了鱼头圆心`headPoint`的位置。

那么C点的求法和鱼头圆心的求法是一样的，只要根据鱼重心点`middlePoint`和控制点C的偏移角度θ以及控制点C和`middlePoint`之间的距离就可以算出C点的位置。

`middlePoint`已知，控制点C和`middlePoint`之间的距离也规定为了1.6R，所以只要知道C点和`middlePoint`的偏移角度即可。

先求出鱼头圆心`headPoint`与鱼重心点的偏移角`delta`

`θ = delta - angle/2`

当θ，middlePoint，控制点C和`middlePoint`之间的距离都有了之后就可以代入Drawable中的calculatePoint接口计算C点的位置，代码如下：

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 起始点
	PointF fishMiddle = new PointF(ivFish.getX() + fishImageViewMiddle.x,
								   ivFish.getY() + fishImageViewMiddle.y);
	// 鱼头的坐标 -- 相对于 水池的 坐标 -- 控制点1
	PointF fishHead = new PointF(ivFish.getX() + fishDrawable.getHeadPoint().x,
								 ivFish.getY() + fishDrawable.getHeadPoint().y);
	// 点击位置 -- 结束点
	PointF touch = new PointF(touchX, touchY);

	float angle = includedAngle(fishMiddle, fishHead, touch);
	float delta = includedAngle(fishMiddle, new PointF(fishMiddle.x + 1, fishMiddle.y), fishHead);
	// 控制点2
	PointF controlPoint = fishDrawable.calculatePoint(fishMiddle,
													  FishDrawable.HEAD_RADIUS * 1.6f, angle / 2 + delta);

	Path path = new Path();
	path.moveTo(ivFish.getX(), ivFish.getY());
	path.cubicTo(fishHead.x - fishImageViewMiddle.x, fishHead.y - fishImageViewMiddle.y,
				 controlPoint.x - fishImageViewMiddle.x, controlPoint.y - fishImageViewMiddle.y,
				 touchX - fishImageViewMiddle.x, touchY - fishImageViewMiddle.y);


	ObjectAnimator objectAnimator = ObjectAnimator.ofFloat(ivFish, "x", "y", path);
	objectAnimator.setDuration(2000);
	objectAnimator.start();

}
```

现在就只剩下鱼头的朝向摆动了，当我们点击某个位置后，鱼头应该转向然后游动过来，鱼重点和鱼头连线应该和鱼游动的路线相切，所以这里使用了PathMeasure。

> `PathMeasure` 是 一个用于测量 `Path` 路径点坐标的工具类。它可以用来获取路径的长度、路径上特定点的位置和切线信息，以及截取路径的一段等。以下是 `PathMeasure` 的一些常用方法和构造函数的介绍：
>
> 构造函数
>
> 1. `PathMeasure()`: 创建一个空的 `PathMeasure` 对象，需要通过 `setPath(Path path, boolean forceClosed)` 方法关联一个 `Path`。
> 2. `PathMeasure(Path path, boolean forceClosed)`: 创建一个与指定 `Path` 关联的 `PathMeasure` 对象。`forceClosed` 参数决定是否将路径视为闭合的，即使它没有显式闭合。
>
> 公共方法
>
> + `setPath(Path path, boolean forceClosed)`: 关联一个 `Path` 到 `PathMeasure`。
> + `getLength()`: 返回关联 `Path` 当前轮廓的长度。
> + `getPosTan(float distance, float[] pos, float[] tan)`: 计算 `distance` 距离处的点的位置和切线信息。
> + `getMatrix(float distance, Matrix matrix, int flags)`: 获取指定距离处的点的信息，并填充到 `Matrix` 对象中。
> + `getSegment(float startD, float stopD, Path dst, boolean startWithMoveTo)`: 截取从 `startD` 到 `stopD` 之间的路径片段。
> + `isClosed()`: 判断当前轮廓是否闭合。
> + `nextContour()`: 移动到 `Path` 中的下一个轮廓。
>
> 使用场景
>
> `PathMeasure` 常用于创建路径动画、测量路径长度、获取路径上特定点的位置和切线信息等。例如，可以用于实现沿着路径移动的图标或者文本，或者在路径上创建复杂的动画效果。
>
> 示例代码
>
> `Path path = new Path();`
>
> `path.addCircle(0, 0, 100, Path.Direction.CW);`
>
> `PathMeasure pathMeasure = new PathMeasure(path, false);`
>
> `float length = pathMeasure.getLength(); // 获取路径长度`
>
> `float[] pos = new float[2];`
>
> `float[] tan = new float[2];`
>
> `pathMeasure.getPosTan(50, pos, tan); // 获取长度为50处的坐标和切线`
>
> 注意事项
>
> + 如果 `Path` 发生变化，需要重新调用 `setPath` 方法更新 `PathMeasure`。
> + `forceClosed` 参数影响测量结果，但不会实际修改 `Path`。
>

使用`PathMeasure`绘制鱼重点和鱼头连线的方向，即fishDrawable中的fishMainAngle值。

```java
final PathMeasure pathMeasure = new PathMeasure(path, false);
final float[] tan = new float[2];
objectAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
	@Override
	public void onAnimationUpdate(ValueAnimator animator) {
		//执行了周期的多少百分比
		float fraction = animator.getAnimatedFraction();
		//得到路径的切线
		pathMeasure.getPosTan(pathMeasure.getLength() * fraction, null, tan);
		// 数学坐标系的y轴正向是向上的，android的y轴正向是向下的，与实际坐标相反，tan[1] 需要取反
		float angle = (float) Math.toDegrees(Math.atan2(-tan[1], tan[0]));
		fishDrawable.setFishMainAngle(angle);
	}
});
```

所以最终游动路径的代码

```java
private void makeTrail() {
	PointF fishImageViewMiddle = fishDrawable.getMiddlePoint();
	// 起始点
	PointF fishMiddle = new PointF(ivFish.getX() + fishImageViewMiddle.x,
			ivFish.getY() + fishImageViewMiddle.y);
	// 鱼头的坐标 -- 相对于 水池的 坐标 -- 控制点1
	PointF fishHead = new PointF(ivFish.getX() + fishDrawable.getHeadPoint().x,
			ivFish.getY() + fishDrawable.getHeadPoint().y);
	// 点击位置 -- 结束点
	PointF touch = new PointF(touchX, touchY);

	float angle = includedAngle(fishMiddle, fishHead, touch);
	float delta = includedAngle(fishMiddle, new PointF(fishMiddle.x + 1, fishMiddle.y), fishHead);
	// 控制点2
	PointF controlPoint = fishDrawable.calculatePoint(fishMiddle,
			FishDrawable.HEAD_RADIUS * 1.6f, angle / 2 + delta);

	Path path = new Path();
	path.moveTo(ivFish.getX(), ivFish.getY());
	path.cubicTo(fishHead.x - fishImageViewMiddle.x, fishHead.y - fishImageViewMiddle.y,
			controlPoint.x - fishImageViewMiddle.x, controlPoint.y - fishImageViewMiddle.y,
			touchX - fishImageViewMiddle.x, touchY - fishImageViewMiddle.y);


	ObjectAnimator objectAnimator = ObjectAnimator.ofFloat(ivFish, "x", "y", path);
	objectAnimator.setDuration(2000);
	objectAnimator.start();

	final PathMeasure pathMeasure = new PathMeasure(path, false);
	final float[] tan = new float[2];
	objectAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
		@Override
		public void onAnimationUpdate(ValueAnimator animator) {
			//执行了周期的多少百分比
			float fraction = animator.getAnimatedFraction();
			//得到路径的切线
			pathMeasure.getPosTan(pathMeasure.getLength() * fraction, null, tan);
			//数学坐标系的y轴正向是向上的，android的y轴正向是向下的，与实际坐标相反，tan[1] 需要取反
			float angle = (float) Math.toDegrees(Math.atan2(-tan[1], tan[0]));
			fishDrawable.setFishMainAngle(angle);
		}
	});

	objectAnimator.start();
}
```

