详细的文档查阅[Material Design 1 中文文档](https://www.mdui.org/zh-cn/design/1/#elevation-shadows-elevation-android)

## 一、什么是MaterialDesign
Material Design 中文名：材料设计语言，是由Google推出的全新的设计语言，谷歌表示，这种设计语言旨在为手机、 平板电脑、台式机和“其他平台提供更一致、更广泛的“外观和感觉”。

>    Tip:在Android5.0最引人注意的就是MaterialDesign设计风格MaterialDesign：谷歌拿出美苹果的设计过去Google的产品线，每一个都相当的独立，在产品的设计上反映得尤为明显，甚至不必看产品设计，只要看一下Google每款产品的LOGO都能发现许多不同风格的设计。这种混乱难以体现出Google的风格，如果Google的风格不是混乱和无序的话。2011年，拉里·佩奇成为GoogleCEO之后，他管理公司的政策从过去的自由、放任，变为紧密、整合。根据我们的报道在Google发展的早期，因为鼓励观点的碰撞，结果发展成一种不留情面的争论氛围，高管之间冲突不断，甚至会拒绝合作。佩奇决心要改变公司的氛围，2013年2月，在纳帕山谷的卡内罗斯客栈酒店里，他对所有Google高管说，Google要实现10倍的发展速度，要用全新的方法来解决问题，因此高管之间要学会合作。从现在开始，Google要对争斗零容忍。
>

+ MaterialDesign不再让像素处于同一个平面，而是让它们按照规则处于空间当中，具备不同的维度
+ MaterialDesign还规范了Android的运动元素
+ MaterialDesign更加倾向于用色彩来提示

Google发布的MaterialDesign语言更像是一套界面设计标准

## 二、Z轴
在MaterialDesign主题当中给UI元素引入了高度的概念，视图的高度由属性Z来表示，决定了阴影的视觉效果，Z越大，阴影就越大且越柔和。但是Z值并不会影响视图的大小。

视图的z值由两个分量表示

   1.Elevation：静态的分量

  2.Translation：用于动画的动态的分量

Z值的计算公式为：Z=elevation+translationz

+ 通过在xml布局文件当中给一个视图设置android:elevation属性，来设置视图的高度。当然我们也可以在代码当中使用View.setElevation来给视图设置高度
+ 还可以在代码当中设置视图的translationz分量：View.setTranslationz0
+ 新的ViewPropertyAnimator.z0以及ViewPropertyAnimator.translationZ0方法能够很容易的改变视图的高度。关于这个动画的更多信息，参考ViewPropertyAnimator以及PropertyAnimation相关的API。
+ 还可以给视图设置Android:StateListAnimator属性来设置视图的状态改变动画，比如当点击按钮的时候改变其translationz分量的值
+ Z值的单位是dp


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726709278155-49bfc295-56bc-4656-8908-8c85afe2b701.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1125%2Climit_0)

## 三、Material Design的一些theme
+ Theme.Materialcomponents
+ Theme.MaterialComponents.NoActionBar
+ Theme.Materialcomponents.Light
+ Theme.Materialcomponents.Light.NoActionBa
+ Theme.Materialcomponents.Light.DarkActionBar
+ Theme.Materialcomponents.DayNight
+ Theme.Materialcomponents.DayNight.NoActionBar
+ Theme.MaterialComponents.DayNight.DarkActionBar

## 四、Toolbar
> [https://developer.android.com/reference/com/googlelandroid/material/packages](https://developer.android.com/reference/com/googlelandroid/material/packages)
>

Toolbar是在Android5.0开始推出的一个MaterialDesign风格的导航控件，Google非常推荐大家使用Toolbar来作为Android客户端的导航栏，以此来取代之前的Actionbar。与Actionbar相比，Toolbar明显要灵活的多。它不像Actionbar一样，一定要固定在Activity的顶部，而是可以放到界面的任意位置。除此之外，在设计Toolbar的时候，Google也留给了开发者很多可定制修改的余地，这些可定制修改的属性在API文档中都有详细介绍，如：

+ 设置导航栏图标
+ 设置App的logo
+ 支持设置标题和子标题
+ 支持添加一个或多个的自定义控件
+ 支持ActionMenu

在布局文件中设置

+ app:navigationlcon 设置navigation button
+ app:logo设置logo图标
+ app:title设置标题
+ app:titleTextcolor设置标题文字颜色
+ app:subtitle设置副标题
+ app:subtitleTextcolor设置副标题文字颜色
+ app:popupTheme Reference to a theme that should be used to inflate popups- shown bywidgets in the toolbar.
+ app:titleTextAppearance设置titletext相关属性，如：字体，颜色，大小等等
+ app:subtitleTextAppearance设置subtitletext相关属性，如：字体，颜色，大小等等
+ app:logoDescription logo描述
+ android:backgroundToolbar背景
+ android:theme主题

使用ToolBar,必须要求NoActionBar的主题，设置

 <item name="windowActionBar">false</item>

<item name="windowNoTitle">true</item>

style设置的作用域app -> activity ->xxx theme，改变某个值的时候使用后面的可以重写覆盖前面的

## 五、FloatingActionButton
FloatingActionButton是一个继承ImageView悬浮的动作按钮，经常用在一些比较常用的操作中，一页面尽量只有一个FloatingActionButton，否则会给用户一种错乱的感觉！FloatingActionButton的大小分为标准型（56dp）和迷你型（40dp），google是这么要求的，如果你不喜欢可以自己设置其他大小。并且对于图标进行使用materialDesign的图标，大小在24dp为最佳！

>     android:src设置相应图片
>
>     app:backgroundTint设置背景颜色
>
>     app:borderWidth设置边界的宽度。如果不设置Odp，那么在4.1的sdk上FAB会显示为正方形，而在5.0以后的sdk没有阴影效果
>
>     app:elevation设置阴影效果
>
>     app:pressedTranslationz按下时的阴影效果
>
>     app:fabsize设置尺寸normal对应56dp，mini对应40dp
>
>     app:layout_anchor设置点，相对于那个控件作为参考
>
>     applayout_anchorGravity设置相对点的位置top/bottom之类的参数
>
>     app:ripplecColor设置点击之后的连颜色
>

## 六、Snackbar
Snackbar就是一个类似Toast的快速弹出消息提示的控件，手机上显示在底部，大屏幕设备显示在左侧。但是在显示上比Toast丰富，也提供了于用户交互的接口

## 七、BottomAppBar
MaterialDesign的一个重要特征是设计BottomAppBar。可适应用户不断变化的需求和行为，So，BottomAppBar是一个从标准物质指导的演变。它更注重功能，增加参与度，并可视化地定UI

>   要求Activity的主题必须是Materialcomponents的主题
>

+ style=@style/widget.Materialcomponents.BottomAppBar
+ 可以通过FabAlignmentMode，FabCradleMargin， FabCradleRoundedCornerRadius和
+ FabcradleVerticaloffset来控制FAB的放置
+ （FabAlignmentMode）可以设置为中心或结束。如果FabAttached设置为True，那么Fab将被布置为连接到BottomAppBar；
+ FabcradleMargin是设置FAB和BottomAppBar之间的间距，改变这个值会增加或减少FAB和BottomAppBar之间的间距；
+ FabcradleRoundedcornerRadius指定切口周围角的圆度
+ FabcradleVerticaloffset指定FAB和BottomAppBar之间的垂直偏移量。如果fabcradleVerticaloffset为0，则FAB的中心将与BottomAppBar的顶部对齐。

## 八、NavigationView
Navigationview表示应用程序的标准导航菜单，菜单内容可以由菜单资源文件填充。NavigationView通常放在DrawerLayout中，可以实现侧滑效果的UI。DrawerLayout布局可以有3个子布局，第一个布局必须是主界面且不可以不写，其他2个子布局就是左、右两个侧滑布局，左右两个侧滑布局可以只写其中一个

+ android:layout_gravity值为start是从左侧滑出，值为end则是从右侧滑出
+ app:menuNavigationview是通过菜单形式在布局中放置元素的，值为自己创建的菜单文件app:headerLayout给NavigationView设置头文件
+ app:itemTextcolor设置菜单文字的颜色
+ appitemlconTint设置菜单图标的颜色
+ app:itemBackground设置菜单背景的颜色

## 九、BottomNavigationView
BottomNavigationView创建底部导航栏，用户只需轻点一下即可轻松浏览和切换顶级内容视图，当项目有3到5个顶层（底部） 目的地导航到时，可以使用此模式。

   1.创建一个菜单资源，最多5个导航目标（BottomNavigationView不支持超过5个项目）

  2.在内容下面放置BottomNavigationview；

  3.将BottomNavigationview上的app：menu属性设置为菜单资源

  4.设置选择监听事件setonNavigationltemSelectedListener(...

  5.通过app:itemlconTint和app:itemTextcolor设置响应用户点击状态。包括Icon以及字体颜色


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726713606834-942aa109-74a8-4bb3-b17a-00dc55b469d8.png)

设置style


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726713588925-61f67cd5-cf5b-4e0d-9e0e-4ae8d763d23c.png)

## 十、DrawerLayout
DrawerLayout是V4Library包中实现了侧滑菜单效果的控件，可以说drawerLayout是因为第三方控件如MenuDrawer等的出现之后，google借鉴而出现的产物。drawerLayout分为侧边菜单和主内容区两部分，侧边菜单可以根据手势展开与隐藏（drawerLayout自身特性），主内容区的内容可以随着菜单的点击而变化.

1.抽式导航栏是显示应用主导航菜单的界面面板。当用户触摸应用栏中的抽冠式导航栏图标或用户从屏幕的左边缘滑动手指时，就会显示抽式导航栏

2.抽式导航栏图标会显示在使用DrawerLayout的所有顶级目的地上。顶级目的地是应用的根级目的地。它们不会在应用栏中显示向上按钮

3.要添加抽冠式导航栏，请先声明DrawerLayout为根视图。在DrawerLayout内，为主界面内容以及包含抽式导航栏内容的其他视图添加布局

4.例如，以下布局使用含有两个子视图的DrawerLayout：包含主内容的NavHostFragment和适用于抽式导航栏内容的Navigationview

```java

```

## 十一、CardView

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726713784213-0c85c3a4-9c74-4576-9baa-23a7cf29f783.png)

## 十二、Chips

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726713855101-fb4f7548-f765-4977-b54e-31a5800d83aa.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726713993245-32c75fa7-bfd0-430d-8c3d-41715c0f5c48.png)

## 十三、Material Button

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714017664-5558ee01-b855-476d-8c34-4512d914b174.png)

## 十四、TextInputLayout&TextInputEditText
TextInputLayout包含一个TextInputEditText，登录注册界面布局的输入框，设置提示等


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714045908-d35ca8e5-78e3-4bcc-91a9-927d294ae53e.png)

## 十五、TabLayout

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714065205-4b628072-9d7b-4b3e-bef4-68f08a8098da.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714104810-cc63890a-30f8-444b-b69d-ed28d1483342.png)

## 十六、Bottom Sheet

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714130249-40d474d7-8f9b-4234-9684-00784aca9de9.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714141576-f5a950a3-bb9d-4d49-b8ba-2dd3a26a9cb3.png)

## 十七、CoordinatorLayout

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714160762-302f58b5-e6b0-436d-9f5c-cadcfcb1fed8.png)

### 1、AppBarLayout

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714177924-4fb82c3d-a845-4de9-86b8-976608713f56.png)

### 2、CollapsingToolbarLayout

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714202134-3b86360c-41e4-4729-9f22-0eed70dbe129.png)

### 3、NestedScrollView

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714220146-7e4f2aa0-4103-495e-b9be-7bfa4200f836.png)

### 4、FloatingActionButton

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714234729-6061c00a-c473-47b2-8877-dc640f04a986.png)

### 5、Behavior(注意暂时了解概念就行)

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714265507-9ec6ca7d-9d65-4da9-872c-1e034a29c932.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714282630-5d4abef0-bbe4-47b4-9409-4f17f27d1a05.png)


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726714342966-e1750fef-bb4f-4304-bfa1-d3f2e66e5c91.jpeg)


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726714394702-41b6bd02-2a34-4356-b712-b7bec361eeb7.jpeg)

## 十八、NestedScrollingChild

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714432965-bc50f578-b225-46f1-a2c8-8ae4e1f7c8c6.png)
![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726714542841-2268e643-24ff-4ac8-a0e1-c7abb9c436cc.jpeg)
![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726714595565-d073fba3-c5df-4e06-9435-4862ee7d5b92.jpeg)


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1726714626939-26078001-c996-4c6c-a5fa-447e8d84ea23.jpeg)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714643818-21dd8ade-191f-4144-9640-cab878d83a9c.png)

## 十九、NestedScrollingParent

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714769554-59af8caf-62d6-4d0a-8af5-20adb60f499c.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714782064-273da9d6-39ec-40eb-bf8c-bd10e63f8c8a.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714795863-967a7602-be20-4da9-af5b-f1c1de1e073e.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714813012-ab35011d-1687-4106-9ea9-f75a38eaa92e.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714823591-dabf821c-e793-425b-9ddc-d829435819c8.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714835123-89f2fc2c-14b0-4bdc-bba2-d1229f95ed9c.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714842784-6086c99e-65c8-4b86-9e0e-e980a9b92ac0.png)

## 二十、NestedScrollingParentHelper

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714854785-62bf23ac-bf02-4c9d-a033-5a6cf93fcefc.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714863139-e162e32e-cd62-4426-a48a-1d4def40c931.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714876261-2428675d-d933-4888-ac75-adaebb07e910.png)

## 二十一、NestedScrollingChildHelper

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714889148-dbca716d-4cdd-4441-a9fd-d52ef21fb241.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714959946-2d913155-07bf-47fb-9532-9cf38ca1a719.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714977501-619c5e7f-12e0-45e7-aef7-e4717af7240f.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715005396-76177a35-8f67-4850-a490-ad3d59bc45f2.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715038521-2e1c68a7-1031-4372-b4a7-d8174940683b.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715068637-068580a5-308e-43fe-932a-af48651272a1.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715087594-f3e96f84-8f52-4ddc-812a-93e3d3301346.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715132402-106d97ed-d27f-4340-9e19-32afd99f5c5a.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715144259-56b3d1b2-f64e-4019-bd47-406767e67fd0.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726715159341-b93150b5-4619-49d9-bfa0-319d38980ac1.png)

## 二十二、NestedScrollView

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726714695569-c3bf518b-a5b0-4e14-857b-e906ba2d6553.png)

