## 一、面向对象的思想回答抽象类和接口
java万事万物都是对象，都可以抽象，接口也是一种特殊的抽象类，

相同的点

都是不能创建实际的对象

不同的点

接口只能有方法名，且只能定义final public的属性

抽象类有方法名也可以有方法体，可以有公有私有等属性

应用的场景

接口是对java单继承的补充，java只能有一个父类但是可以有多个接口。

抽象类可以对同类对象抽象出基类，实现共同的方法，但实现交由子类实现，例如BaseActivity、BaseFragment等我们常用的基类，可以使用抽象类时最好使用抽象类，接口和抽象类灵活使用才能使代码设计的更加合理和简洁。

面向接口的编程不只是面向接口，抽象类也可以包含在内。

## 二、谈谈接口和抽象
### 1、介绍
接口（Interface）和抽象类（Abstract Class）都是用于定义类的抽象形式，它们在实现多态性和提供设计框架方面具有重要作用。

接口

1. 接口是一种完全抽象的类，它不能包含任何具体实现，只能定义方法的签名和常量。接口中的所有方法默认都是`public`和`abstract`的。Java 8之后可以有默认方法和静态方法。
2. 类通过使用`implements`关键字来实现接口，并且必须提供接口中所有方法的具体实现，Java 8及以后的版本中，接口中可以定义默认方法（default methods）。默认方法允许在接口中提供方法的实现，而不需要实现该接口的类提供具体实现，主要为了向后兼容性和简单实现类的默认实现，向后兼容主要是当接口广泛使用时，后续添加的接口方法不破坏现有代码
3. 一个类可以实现多个接口，通过接口可以实现多态性，允许不同的类以不同的方式实现相同的方法，接口可以作为类与类之间的契约，降低类之间的耦合度，提高代码的可维护性和可扩展性.

抽象类

1. 抽象类是一种不能被实例化的类，它可以包含抽象方法和具体方法，可以定义属性，可以有不同的访问修饰符。抽象方法没有具体实现，而具体方法则可以有实现.
2. 类通过使用`extends`关键字来继承抽象类，并且必须提供抽象类中所有抽象方法的具体实现.
3. Java不支持多重继承，一个类只能继承一个抽象类，但可以同时实现多个接口
4. 抽象类可以提供一些基础的实现，让子类继承并扩展或重写这些实现；抽象类可以作为类的层次结构中的基类，定义一些共有的属性和方法；通过抽象类可以实现多态性，允许子类以不同的方式实现抽象类中的抽象方法.

### 2、回答
## 三、如果ABC三个类都实现D这个接口，但是C不想实现D接口的某个方法，应该怎么做？
### 1、回答
1. 如果接口 `D` 是在 Java 8 或更高版本中定义的，可以将该方法定义为默认方法，并提供一个默认实现。这样，类 `C` 可以直接继承这个默认实现，而不需要提供自己的实现
2. 如果接口 `D` 有很多方法，而类 `C` 只需要实现其中的几个，可以使用适配器模式。适配器模式提供了一个实现了接口所有方法的类，类 `C` 可以继承这个适配器类，并只重写需要的方法
3. 重新考虑接口的设计。可以将接口 `D` 分解为几个更小的接口，每个接口只包含一组相关的功能。然后让类 `C` 只实现它需要的接口(完全用不到D的那个接口时，重新设计接口是更好的，因为随者代码的增加，这种方法的耦合会使得代码更加臃肿和难以维护)

## 四、谈下对多态的理解(OOP介绍，项目中多态在哪里用过)
### 1、介绍
面向对象编程（Object-Oriented Programming，简称OOP）是一种编程范式，它使用“对象”来表示数据和方法，并通过类和对象来组织代码。OOP的核心概念包括封装、继承和多态.

OOP的核心概念

+ 封装（Encapsulation）：
    - 定义：封装是将对象的数据（属性）和操作数据的方法（行为）捆绑在一起，并对外隐藏对象的内部实现细节，只通过公共接口与外界交互.
    - 作用：保护数据的安全性和完整性，防止外部代码随意访问和修改对象的内部状态；提高代码的可维护性和可复用性.
+ 继承（Inheritance）：
    - 定义：继承是一种类与类之间的关系，允许一个类（子类）继承另一个类（父类）的属性和方法，从而实现代码的复用和层次结构的建立.
    - 作用：减少代码重复，提高代码的可维护性和可扩展性；实现多态的基础.
+ 多态（Polymorphism）：
    - 定义：多态是指允许不同类的对象对同一消息做出响应，即同一个接口可以被不同的对象以不同的方式实现.
    - 作用：提高代码的灵活性和可扩展性，使得代码更加通用和简洁；实现解耦合，降低类之间的依赖关系.

多态（Polymorphism）是面向对象编程（OOP）的核心概念之一，它允许你通过父类的引用来调用子类的方法，从而实现不同的行为。多态在Java中主要体现在两个方面：方法重载（Overloading）和方法覆盖（Overriding）

方法重载是指在同一个类中，允许存在多个同名的方法，只要它们的参数列表不同（参数的类型、数量或顺序不同）

+ 静态多态：方法重载属于静态多态，因为方法的调用是在编译时确定的，编译器会根据方法的参数列表来选择具体调用哪个方法。
+ 参数不同：重载的方法必须在参数的数量、类型或顺序上有所区别，返回类型可以不同，但不能仅通过返回类型来区分重载的方法.
+ 作用：方法重载提高了代码的可读性和可维护性，使得可以为不同的参数提供相同的操作名称，从而简化代码的编写和理解.

方法覆盖是指在子类中重写父类的方法，使得子类对象可以调用子类的实现，而不是父类的实现。

+ 动态多态：方法覆盖属于动态多态，因为方法的调用是在运行时确定的，JVM会根据对象的实际类型来动态调用相应的方法.
+ 条件：子类方法必须与父类方法具有相同的名称、参数列表和返回类型（或兼容的返回类型）；子类方法的访问权限不能比父类方法更严格.
+ 作用：方法覆盖允许子类根据自己的需求改变或扩展父类的行为，从而实现多态性，使得代码更加灵活和可扩展.

多态的好处

+ 提高代码的可维护性：通过多态，可以将不同的对象视为同一类型，从而简化代码的编写和维护。例如，可以编写通用的方法来处理不同类型的对象，而不需要为每种类型编写单独的方法.
+ 提高代码的可扩展性：多态使得添加新的类或行为变得更加容易，而不需要修改现有的代码。例如，可以添加新的子类来扩展父类的行为，而不需要修改使用父类引用的代码.
+ 实现解耦合：多态可以降低类之间的耦合度，使得代码更加灵活和可重用。例如，通过接口或抽象类定义行为规范，不同的类可以实现或继承这些规范，而不需要依赖于具体的实现细节.

多态的实现机制

+ 动态绑定：Java中的多态是通过动态绑定（Dynamic Binding）实现的。当调用一个方法时，JVM会根据对象的实际类型来动态调用相应的方法，而不是根据引用的类型。这是通过虚方法表（VTable）等机制来实现的.
+ 运行时类型识别：多态的实现还需要运行时类型识别（RTTI），即在运行时能够识别对象的实际类型。Java提供了`instanceof`运算符和`getClass()`方法等来实现运行时类型识别.

多态的应用场景

1. 图形界面编程中，通常有一个通用的图形接口或抽象类，如Shape，定义了绘制图形的方法（如draw()）。具体的图形类（如Circle、Rectangle、Triangle等）实现这个接口或继承这个抽象类，并提供具体的绘制方法。通过多态，可以在同一个方法中处理不同类型的图形对象
2. 工厂模式，定义一个工厂接口来创建对象，具体的工厂类实现这个接口，并根据不同的条件创建不同类型的对象。客户端代码通过工厂接口来获取对象，而不需要知道具体的创建细节，实现多态性。

### 2、回答
## 五、多态和继承有什么区别？
### 1、介绍
多态（Polymorphism）和继承（Inheritance）是面向对象编程（OOP）中的两个核心概念，它们在目的、实现方式和应用场景上有一些区别

继承（Inheritance）

+ 定义：继承是一种类与类之间的关系，允许一个类（子类）继承另一个类（父类）的属性和方法。子类可以扩展或重写父类的实现.
+ 目的：
    - 代码复用：通过继承，子类可以复用父类的代码，减少重复代码的编写.
    - 建立层次结构：继承可以建立类之间的层次结构关系，反映现实世界中的“是一种”关系，如“猫是一种动物”.
+ 实现方式：使用`extends`关键字来实现继承.
+ 特点：
    - 单继承：Java不支持多重继承，一个类只能继承一个父类，但可以通过多层继承来实现间接的继承关系.
    - 继承所有成员：子类继承父类的所有非私有属性和方法，包括构造函数（通过调用父类的构造函数）.
    - 实现细节共享：子类可以访问和使用父类的具体实现细节，包括属性和方法的具体实现.

多态（Polymorphism）

+ 定义：多态是指允许不同类的对象对同一消息做出响应，即同一个接口可以被不同的对象以不同的方式实现，多态的实现主要依赖于 继承 和 接口。
+ 目的：
    - 提高灵活性：通过多态，可以编写通用的代码来处理不同类型的对象，使得代码更加灵活和可扩展.
    - 实现解耦合：多态可以降低类之间的耦合度，使得代码更加松耦合，易于维护和扩展.
+ 实现方式：通过接口实现或方法覆盖来实现多态.
    - 接口实现：一个类实现接口，并提供接口中方法的具体实现，不同的实现类可以有不同的实现方式.
    - 方法覆盖：子类重写父类的方法，使得子类对象可以调用子类的实现，而不是父类的实现.
+ 特点：
    - 动态绑定：多态是通过动态绑定实现的，即在运行时根据对象的实际类型来调用相应的方法.
    - 行为规范：多态通常与接口或抽象类一起使用，接口或抽象类定义了一组行为规范，实现类或子类必须遵守这些规范.
    - 运行时类型识别：多态的实现需要运行时类型识别，即在运行时能够识别对象的实际类型.

区别

+ 目的和重点：
    - 继承：重点在于实现代码复用和建立类的层次结构，关注于类之间的“是一种”关系.
    - 多态：重点在于提高代码的灵活性和实现解耦合，关注于对象的行为和接口的实现.
+ 实现方式：
    - 继承：通过`extends`关键字实现，涉及类的属性和方法的继承.
    - 多态：通过接口实现或方法覆盖实现，涉及对象的行为和方法的调用.
+ 代码结构：
    - 继承：建立类之间的层次结构，形成树状结构.
    - 多态：通过接口或抽象类定义行为规范，实现类或子类提供具体的实现，形成网状结构.
+ 使用场景：
    - 继承：适用于类的层次结构和代码复用，如动物类、哺乳动物类、猫类等.
    - 多态：适用于需要通用代码处理不同对象、实现解耦合和提高灵活性的场景，如图形绘制、事件处理、策略模式等.

总结

继承主要用于代码复用和建立类的层次结构，而多态则用于提高代码的灵活性和实现解耦合。在实际开发中，通常会结合使用继承和多态来实现复杂的功能和灵活的设计.

### 2、回答
## 六、继承和接口实现的区别
### 1、介绍
继承和接口实现是两种不同的机制，用于实现代码复用和建立类之间的关系。以下是对它们的详细比较：

继承（Inheritance）

+ 定义：继承是一种类与类之间的关系，允许一个类（子类）继承另一个类（父类）的属性和方法。子类可以扩展或重写父类的实现.
+ 关键字：使用`extends`关键字来实现继承.
+ 特点：
    - 单继承：Java不支持多重继承，一个类只能继承一个父类.
    - 继承所有成员：子类继承父类的所有非私有属性和方法，包括构造函数（通过调用父类的构造函数）.
    - 实现细节共享：子类可以访问和使用父类的具体实现细节，包括属性和方法的具体实现.
    - 构造函数：子类必须调用父类的构造函数来初始化继承的属性，通常通过`super()`来实现.
+ 使用场景：
    - 类的层次结构：适用于建立具有层次结构关系的类，如动物类、哺乳动物类、猫类等.
    - 代码复用：当多个类有共同的属性和方法时，可以通过继承来复用这些代码，减少重复代码的编写.
    - 实现多态：通过继承可以实现多态性，允许子类重写父类的方法，从而实现不同的行为.

接口实现（Interface Implementation）

+ 定义：接口实现是一种类与接口之间的关系，允许一个类实现一个或多个接口，从而遵循接口定义的行为规范.
+ 关键字：使用`implements`关键字来实现接口.
+ 特点：
    - 多实现：一个类可以实现多个接口，从而具备多种行为规范.
    - 抽象方法：接口中的方法默认是抽象的，实现类必须提供接口中所有方法的具体实现（除非实现类本身也是抽象类）.
    - 行为规范：接口定义了一组行为规范，实现类必须遵守这些规范，但接口本身不提供实现细节.
    - 灵活性高：接口提供了一种灵活的方式来定义类的行为，实现类可以根据需要选择实现哪些接口.
+ 使用场景：
    - 定义行为规范：适用于定义一组行为规范，类可以实现这些接口来提供具体的行为实现.
    - 解耦合：通过接口可以降低类之间的耦合度，实现类只需要关注接口定义的行为，而不需要关注具体的实现细节.
    - 多态性：接口实现也支持多态性，允许不同的实现类以不同的方式实现接口中的方法.

区别

+ 继承层次：
    - 继承：建立类之间的层次结构关系，反映现实世界中的“是一种”关系，如“猫是一种动物”.
    - 接口实现：定义类的行为规范，反映“能够做”或“具有某种能力”的关系，如“能够飞行”、“能够游泳”.
+ 实现细节：
    - 继承：子类可以访问父类的具体实现细节，包括属性和方法的具体实现.
    - 接口实现：接口不提供实现细节，实现类必须提供接口中所有方法的具体实现.
+ 多继承与多实现：
    - 继承：Java不支持类的多重继承，一个类只能继承一个父类.
    - 接口实现：Java支持接口的多实现，一个类可以实现多个接口.
+ 用途：
    - 继承：适用于类的层次结构和代码复用，实现多态的基础.
    - 接口实现：适用于定义行为规范和解耦合，实现多态性.
+ 灵活性：
    - 继承：灵活性相对较低，因为一个类只能继承一个父类.
    - 接口实现：灵活性较高，允许一个类实现多种行为，同时可以避免多重继承带来的复杂性.

### 2、回答
## 七、继承和接口实现哪个更适合大型项目？
### 1、介绍
接口实现的优点

+ 灵活性高：
    - 多实现：一个类可以实现多个接口，这使得类可以具备多种行为规范，而不受单一继承层次的限制.
    - 解耦合：通过接口定义行为规范，实现类与接口之间是松耦合的，实现类只需要关注接口定义的行为，而不需要依赖于具体的实现细节. 这有助于降低类之间的依赖关系，提高代码的可维护性和可扩展性.
+ 可维护性：
    - 易于扩展：接口可以作为项目中不同组件之间的契约，当需要添加新的行为时，可以通过添加新的接口来实现，而不需要修改现有的类结构. 这有助于在不影响现有代码的情况下，扩展系统的功能.
    - 易于测试：接口提供了一个清晰的契约，使得可以更容易地为实现类编写单元测试，通过模拟接口的实现来测试类的行为.
+ 支持多态性：接口实现支持多态性，允许不同的实现类以不同的方式实现接口中的方法，从而实现灵活的运行时行为.

继承的优点

+ 代码复用：
    - 共享实现细节：继承允许子类复用父类的代码，包括属性和方法的具体实现，这可以减少重复代码的编写，提高代码的复用率.
    - 层次结构清晰：通过继承可以建立清晰的类层次结构，反映现实世界中的“是一种”关系，有助于组织和理解代码.
+ 实现多态性：继承是实现多态性的基础，子类可以重写父类的方法，从而实现不同的行为，这在大型项目中可以用于构建灵活的类层次结构.

适合大型项目的场景

+ 接口实现更适合：
    - 当需要定义多种行为规范时：如果项目中有多种不同的行为或功能需要实现，使用接口可以更好地组织这些行为，使得类可以根据需要实现不同的接口.
    - 当需要降低类之间的耦合度时：在大型项目中，降低类之间的耦合度是非常重要的，接口实现可以提供一种松耦合的方式来定义类的行为，有助于提高代码的可维护性和可扩展性.
    - 当需要支持灵活的扩展和维护时：接口实现使得在不影响现有代码的情况下，更容易添加新的行为和功能，这对于大型项目的长期维护和扩展是非常有利的.
+ 继承更适合：
    - 当存在明显的类层次结构时：如果项目中的类之间存在清晰的“是一种”关系，且需要共享大量的实现细节，继承可以更好地表示这种关系，并提供代码复用.
    - 当需要构建复杂的类层次结构时：在一些需要构建复杂类层次结构的场景中，继承可以提供一种清晰的方式来组织类之间的关系，使得代码结构更加合理.

### 2、回答
## 八、谈一下对final关键字的理解
### 1、介绍
final关键字是一个非常重要的修饰符，它可以用于修饰变量、方法和类，具有不同的含义和用途:

1. 当`final`修饰一个基本数据类型的变量时，这个变量就变成了常量，其值在初始化后不能被修改,避免在代码中硬编码，提高代码的可维护性和可读性.
2. 当`final`修饰一个引用类型的变量时，它确保这个引用变量不能再指向其他对象，但对象本身的内容是可以被修改的.
3. 当`final`修饰一个方法时，这个方法不能被子类重写,保护父类中的某些关键方法不被子类改变，确保某些行为的一致性,在某些情况下，编译器可以对`final`方法进行优化，因为编译器知道这个方法不会被重写，所以可以进行一些优化操作，如内联等，从而提高程序的性能.
4. 当`final`修饰一个类时，这个类不能被继承,确保某个类的实现细节不被外部访问和修改，提高类的安全性和封装性，例如Java中的`String`类就是`final`的，确保字符串的不可变性.

`final`关键字在Java中提供了代码的稳定性和安全性，通过限制变量、方法和类的修改和继承，可以有效地防止一些潜在的错误和风险，同时也有助于提高程序的性能和可维护性.

### 2、回答
final关键字是一个非常重要的修饰符，它可以用于修饰变量、方法和类，当`final`修饰一个基本数据类型的变量时，值在初始化后不能被修改；当`final`修饰一个引用类型的变量时，确保这个引用变量不能再指向其他对象，但对象本身的内容是可以被修改的；当`final`修饰一个方法时，这个方法不能被子类重写；当`final`修饰一个类时，这个类不能被继承，确保了类的实现细节不被外部访问和修改，提高类的安全性和封装性，例如Java中的`String`类就是`final`的，确保字符串的不可变性。

## 九、说一下依赖注入，有没有使用过依赖注入？
### 1、介绍
依赖注入（Dependency Injection，简称DI）是一种软件设计模式，允许对象间的依赖关系通过配置或代码在运行时动态注入，而不是通过对象内部硬编码，用于减少软件组件之间的耦合度，提高代码的可重用性、可维护性和可测试性，依赖注入通常通过以下几种方式实现：

1. 构造函数注入是通过类的构造函数将依赖项传递给对象。这种方式可以确保对象在被创建时完全初始化，并且依赖项是不可变的：

```java
//UserService类通过构造函数接收一个UserDao对象，然后在addUser方法中使用它
public class UserService {
    private final UserDao userDao;

    public UserService(UserDao userDao) {
        this.userDao = userDao;
    }

    public void addUser(User user) {
        userDao.addUser(user);
    }
}
```

2. Setter方法注入是通过类的setter方法来注入依赖项。这种方式允许在对象创建后动态地设置依赖项，但可能会导致依赖项在某些时刻未被初始化

```java
//UserService类通过setUserDao方法接收一个UserDao对象
public class UserService {
    private UserDao userDao;

    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }

    public void addUser(User user) {
        userDao.addUser(user);
    }
}
```

3. 字段注入是通过在字段上使用注解（如`@Inject`）来自动注入依赖项。这种方式减少了样板代码，但可能会导致依赖项在对象构造时不明显，不需要编写额外的构造函数或setter方法，依赖注入框架（如Spring）会自动为这些字段注入相应的依赖对象

```java
//UserDao对象是通过@Autowired注解自动注入到UserService类的userDao字段中的
public class UserService {
    @Autowired
    private UserDao userDao;

    public void addUser(User user) {
        userDao.addUser(user);
    }
}
```

字段注入的优点：

+ 减少样板代码：不需要编写构造函数或setter方法，代码更加简洁.
+ 使用方便：直接在字段上使用注解即可完成依赖注入，不需要额外的操作.

字段注入的缺点：

+ 不明确的依赖关系：依赖关系在对象构造时并不明显，可能导致对象在某些时刻未被完全初始化，从而引发错误.
+ 不利于测试：由于依赖项是直接注入到字段中的，测试时可能需要使用反射等手段来设置依赖项，增加了测试的复杂性.
+ 灵活性较低：依赖项的注入是固定的，难以在运行时动态地改变依赖项
4. 接口注入是通过定义一个接口来声明依赖项，然后通过实现该接口来注入依赖项。这种方式较少使用，通常用于特定的场景。

```java
//UserService类实现了UserDaoInjector接口，并通过injectUserDao方法来注入UserDao对象
public interface UserDaoInjector {
    void injectUserDao(UserDao userDao);
}

public class UserService implements UserDaoInjector {
    private UserDao userDao;

    @Override
    public void injectUserDao(UserDao userDao) {
        this.userDao = userDao;
    }

    public void addUser(User user) {
        userDao.addUser(user);
    }
}
```

接口注入的优点：

+ 明确的依赖关系：依赖关系通过接口方法明确声明，对象的依赖项在创建时可以被清晰地看到.
+ 灵活性较高：可以通过不同的实现类来提供不同的依赖项注入方式，具有较高的灵活性.

接口注入的缺点：

+ 增加代码复杂度：需要定义额外的接口和实现类，增加了代码的复杂度和开发工作量.
+ 使用场景有限：通常只用于特定的场景，不如构造函数注入和setter方法注入那样通用

总结

依赖注入的好处

+ 提高可维护性：依赖关系的创建和管理工作交给外部容器，代码更加清晰易懂。
+ 提高可测试性：可以更容易地创建测试用例来测试代码的各个部分。
+ 提高松耦合性：代码不再需要紧密耦合到其依赖关系的具体实现上，从而更容易进行重构和扩展。

依赖注入是实现控制反转（Inversion of Control, IoC）的一种方式，通过外部容器来管理对象的依赖关系，使得对象的创建和依赖关系的管理更加灵活

### 2、回答
依赖注入（Dependency Injection，简称DI）是一种软件设计模式，用于减少软件组件之间的耦合度，提高代码的可重用性、可维护性和可测试性，实现方式有构造函数注入、Setter方法注入、字段注入和接口注入；构造函数注入就是通过类的构造函数将依赖项传递给这个类的对象(即 new A(b) )；setter方法注入与构造函数类似，只不过是在setter方法中将依赖项传递给这个类的对象(如 a.setB(b) )；字段注入通过在字段上使用注解（如`@Inject`）来自动注入依赖项；接口注入是通过定义一个接口来声明依赖项(如接口A中定义setX(X x)方法)，然后通过实现该接口来注入依赖项(实现类中有X属性，通过实现A中定义setX的方法设置X属性值)。

## 十、== 和equals区别

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542760111-df81bd7b-182c-4ca8-b1c7-975cc2bd3d6c.png)

"=="比较基本数据类型时比较的是表面值内容，而比较两个对象时比较的是两个对象的内存地址值

对于equals方法，注意：equals方法不能作用于基本数据类型的变量

如果没有对equals方法进行重写，则比较的是引用类型的变量所指向的对象的地址；

```java
 * Compares this string to the specified object.  The result is {@code
     * true} if and only if the argument is not {@code null} and is a {@code
     * String} object that represents the same sequence of characters as this
     * object.
     *
     * @param  anObject
     *         The object to compare this {@code String} against
     *
     * @return  {@code true} if the given object represents a {@code String}
     *          equivalent to this string, {@code false} otherwise
     *
     * @see  #compareTo(String)
     * @see  #equalsIgnoreCase(String)
     */
    public boolean equals(Object anObject) {
        if (this == anObject) {
            return true;
        }
        if (anObject instanceof String) {
            String anotherString = (String) anObject;
            int n = value.length;
            if (n == anotherString.value.length) {
                char v1[] = value;
                char v2[] = anotherString.value;
                int i = 0;
                while (n-- != 0) {
                    if (v1[i] != v2[i])
                            return false;
                    i++;
                }
                return true;
            }
        }
        return false;
    }
```

从源码中知道，equals()方法存在于Object类中，因为Object类是所有类的直接或间接父类，也就是说所有的类中的equals()方法都继承自Object类，而通过源码我们发现，Object类中equals()方法底层依赖的是==，那么，在所有没有重写equals()方法的类中，调用equals()方法其实和使用==的效果一样，也是比较的地址值，当然，如果是String类型的对象，则会再直接比较string的内容是否一样，然而，Java提供的所有类中，绝大多数类都重写了equals()方法，equals方法进行了重写则是用来比较指向的对象所存储的内容是否相等

## 十一、hashcode的作用，重写equals的时候为什么要重写hashcode
重写equals方法和hashcode方法的目的就是为了实现一些合乎情理，切实际，在现实生活中经常出现的一些情景，针对这些情景来提出一些需求，为了满足这个需求从而采取的措施。如果不重写的话，在他的源码中比较的是俩个对象的地址值。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1735612699475-a47d468f-f9af-4b24-baa0-bf6d2b1e66ae.png)

在这个示例中，尽管 person1 和 person2 的内容相同，但它们是不同的对象，因此 equals 方法返回 false。这显然不是我们想要的行为。

为了解决这个问题，我们需要重写 equals 方法，以便比较对象的内容而不是引用。通常，我们会在自定义类中重写 equals 方法，以实现我们自己的相等性逻辑，比较对象的属性是否相等。

### 1、为什么要重写hashcode,不重写会出现什么问题？

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1735612734286-2122bd31-00f4-4f81-8f07-f47b90b17a81.png)

在这个示例中，尽管 person3 和 person4 的内容相同，但由于它们具有不同的哈希码，set.contains(person4) 返回 false。这是因为哈希表无法正确定位到 person4。

为了解决这个问题，我们需要确保重写 equals 方法的对象也必须重写 hashCode 方法，以便它们的哈希码是相等的。这样，哈希表就能够正确地存储和查找这些对象了。

## 十二、Java中强引用、软引用、弱引用以及虚引用及回收的优先级
[Java四大引用详解：强引用、软引用、弱引用、虚引用](https://segmentfault.com/a/1190000042313862)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542947155-8df55187-107f-40ac-9fad-2cf818cfedd1.png)

## 十三、说一下`String`、`StringBuffer`和`StringBuilder`
### 1、介绍
`String`、`StringBuffer`和`StringBuilder`都是用来处理字符串的类，但它们在性能和线程安全性方面存在一些区别：

String

+ 不可变性：`String`是不可变的，一旦创建，其内容就不能被改变。每次对字符串进行修改操作（如拼接、替换等）时，都会创建一个新的`String`对象.
+ 线程安全：由于不可变性，`String`是线程安全的，可以在多线程环境中安全使用.
+ 性能：由于每次修改都会创建新对象，频繁修改字符串时会导致大量临时对象的产生，从而影响性能。因此，`String`适用于字符串内容不经常变化的场景.
+ 使用场景：适用于字符串内容固定或少量修改的场景，如字符串常量、字符串比较、字符串格式化等.

StringBuffer

+ 可变性：`StringBuffer`是可变的，可以在原有对象的基础上进行修改操作，不会创建新的对象.
+ 线程安全：`StringBuffer`是线程安全的，其所有方法都是同步的（synchronized），可以在多线程环境中安全使用.
+ 性能：由于线程安全的特性，`StringBuffer`的性能相对较低，因为每次操作都需要进行同步锁的获取和释放. 但在多线程环境中，使用`StringBuffer`可以避免线程安全问题.
+ 使用场景：适用于多线程环境中需要频繁修改字符串的场景，如多线程下的字符串拼接、字符串替换等.

StringBuilder

+ 可变性：`StringBuilder`也是可变的，可以在原有对象的基础上进行修改操作，不会创建新的对象.
+ 线程安全：`StringBuilder`是非线程安全的，其方法没有进行同步，不能在多线程环境中安全使用.
+ 性能：由于没有线程安全的开销，`StringBuilder`的性能相对较高，是`StringBuffer`的非线程安全版本.
+ 使用场景：适用于单线程环境中需要频繁修改字符串的场景，如字符串拼接、字符串替换等. 在大多数情况下，推荐使用`StringBuilder`来替代`String`进行字符串的频繁修改，以提高性能.

总结

+ 不可变性：`String`是不可变的，而`StringBuffer`和`StringBuilder`是可变的.
+ 线程安全：`StringBuffer`是线程安全的，而`StringBuilder`是非线程安全的，`String`由于不可变性而天然线程安全.
+ 性能：`StringBuilder`的性能最高，`StringBuffer`次之，`String`在频繁修改字符串时性能最低.
+ 选择依据：在单线程环境中，推荐使用`StringBuilder`来提高性能；在多线程环境中，如果需要线程安全，可以使用`StringBuffer`；如果字符串内容不经常变化，可以直接使用`String`.

### 2、回答
#### (1) 版本1
`String`、`StringBuffer`和`StringBuilder`都是用来处理字符串的类，但它们在性能和线程安全性方面存在一些区别，`String`是不可变的，由于不可变性，所以`String`是线程安全的，但是每次修改都会创建新对象，频繁修改字符串时会导致大量临时对象的产生，影响性能，所以`String`适用于字符串内容不经常变化的场景；`StringBuffer`是可变的，这种变化不会创建新的对象，其所有方法都是同步的（synchronized），所以是线程安全的，由于线程安全，性能相对较低，因为每次操作都需要进行同步锁的获取和释放，但在多线程环境中，使用`StringBuffer`可以避免线程安全问题，适用于多线程环境中需要频繁修改字符串的场景；`StringBuilder`也是可变的，变化也不会创建新的对象，但是因为方法没有进行同步，所以`StringBuilder`是线程不安全的，所以`StringBuilder`的性能相对较高，是`StringBuffer`的非线程安全版本，适用于单线程环境中需要频繁修改字符串的场景，

#### (2) 版本2
`String`、`StringBuffer`和`StringBuilder`都是用来处理字符串的类，但它们在性能和线程安全性方面存在一些区别，`String`是不可变的，而`StringBuffer`和`StringBuilder`是可变的；`StringBuffer`是线程安全的，因为它内部的方法都加了锁，而`StringBuilder`是非线程安全的因为内部方法没有加锁，`String`由于不可变性而天然线程安全；在频繁改变字符串时`StringBuilder`的性能最高，因为不需要读取和释放锁，`StringBuffer`次之，`String`因为每次都要创建新对象所以性能最低；在单线程环境中，推荐使用`StringBuilder`来提高性能；在多线程环境中，如果需要线程安全，可以使用`StringBuffer`；如果字符串内容不经常变化，可以直接使用`String`

## 十四、String s = new String("---")创建了几个String对象
### 1、介绍
`String s = new String("---")` 这行代码创建了 两个`String` 对象

首先，拆解该语句如下：

1. String s；声明一个String类型的变量s，s是一个String类型的引用变量，值位null
2. “---”创建了一个字符串常量，字符串常量（如 `"---"`）会被存储在字符串常量池（String Constant Pool）中，
+ 如果字符串常量池中已经存在相同的字符串，则不会创建新的对象，而是直接引用已存在的对象。
+ 如果字符串常量池中不存在该字符串，则会创建一个新的字符串对象，并将其存储在常量池中。
+ 即如果String s1 = "---"；String s2 = "---"，则s1和s2引用的是同一个字符串常量对象，代码中使用`s1 == s2//比较引用是否相同`和`s1.equals(s2)//比较内容是否相同`得到的都是true
3. `new String("---")`明确的调用了String类的构造函数，创建了一个新的字符串对象，这个新创建的对象与字符串常量池中的对象是不同的，即使内容相同。
+ 如果String s1 = new String("---")；String s2 = "---"`s1 == s2//比较引用是否相同`和`s1.equals(s2)//比较内容是否相同`得到的前者为false，后者是true。

## 十五、形参传基本类型和引用类型的区别
形参（形式参数）的传递方式分为值传递和引用传递。基本类型和引用类型在传递时的行为有所不同。

基本类型在传递时采用值传递。传递的是值的副本，修改不影响原始数据。

引用类型包括对象（如 `String`、`ArrayList` 等）、数组等在传递时采用引用传递（在某些语言中也称为地址传递）。传递的是引用的副本，意味着形参和实参指向同一个对象，修改可能影响原始对象。

## 十六、Android与序列化原理
什么是序列化？

为了能够使一个对象在进程间传递，

序列化就是把一个对象打上标记打包传输

反序列化就是把这个包打开按照标记拿出对象的属性然后构造一个一模一样的对象出来

例如serializable接口和pacelable接口，使用这些接口进行序列化和反序列化的过程，将一个数据从A端传到B端，

serializable是jdk衍生的，pacelable是android独有的，android推荐使用pacelable

serializable是jdk里空的接口，从JDK1.1就有了，不需要任何实现，所以在java中用来做标记的，使用该接口后就对这个类打上了标记，当将该对象写进文件的时候，就必须实现serializable接口，当从文件中拿的时候，反序列化时就可以自动根据serializable的标记将他反序列化出来，可以持久化。

pacelable是android提供的方法，需要实现他的几个必要接口，通过打包行为传递给其他用户端再使用解包去解析使用。不能持久化，没法把类名也序列化提供出去。

网络获取的对象为什么可以使用Gson Json传递，因为使用的string的方式，以特定的方式变成对象式的string，所以便于网络调试和使用。

## 十七、动态代理
### 1、什么是代理模式？
给目标提供一个代理对象，并有代理对象控制目标对象的引用，起到中介作用，连接客户端的目标对象

主要作用：通过引入代理间接访问目标对象

解决的问题：防止直接访问目标对象给系统带来的不必要的复杂性


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732542141253-586cc403-14b6-4e28-af6e-f529aa8bb8dd.jpeg)

静态代理的一般实现：

1. 定义抽象接口IPlayer
2. 定义接口实现类MyPlayer实现IPlayer
3. 定义代理类MyPlayerProxy并同样实现IPlayer接口，同时将MyPlayer通过依赖注入到MyPlayerProxy中

代码如下

```java
public interface IPlayer {
    void loadVideo(String filename);
    void playVideo(String filename);
}

```

```java
public class MyPlayer implements IPlayer {
    @Override
    public void loadVideo(String filename) {
        System.out.println("加载MP4视频文件："+filename);
    }

    @Override
    public void playVideo(String filename) {
        System.out.println("播放MP4视频："+filename);
    }
}

```

```java
public class MyPlayerProxy implements IPlayer {

    private IPlayer iPlayer;

    public MyPlayerProxy(IPlayer iPlayer) {
        this.iPlayer = iPlayer;
    }

    @Override
    public void loadVideo(String filename) {
        iPlayer.loadVideo(filename);
    }

    @Override
    public void playVideo(String filename) {
        iPlayer.playVideo(filename);
    }
}

```

这样，客户端只要如下使用即可

```java
public class Client1 {
    public static void main(String[] args) {
        //直连方式
        IPlayer myPlayer = new MyPlayer();
        myPlayer.playVideo("aaa.mp4");
        System.out.println();

        //代理方式
        IPlayer proxy = new MyPlayerProxy(myPlayer);
        proxy.loadVideo("aaa.mp4");
        proxy.playVideo("aaa.mp4");

    }
}

```

有了静态代理为什么还要动态代理？


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732542301869-7b05f9a2-b5a1-4fce-8fb2-d65645dd5ae2.jpeg)


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732542405284-6d2489bf-a6be-4803-9d0b-68a7161989d1.jpeg)

### 2、动态代理
[java动态代理实现与原理详细分析 - Gonjian - 博客园](https://www.cnblogs.com/gonjan-blog/p/6685611.html)

静态代理的例子中，代理类(studentProxy)是自己定义好的，在程序运行之前就已经编译完成,然而动态代理，代理类并不是在Java代码中定义的，而是在运行时根据我们在Java代码中的“指示”动态生成的。

相比于静态代理， 动态代理的优势在于可以很方便的对代理类的函数进行统一的处理，而不用修改每个代理类中的方法。

例如我们想要在每个代理的方法前都加一个处理方法handleMethod()，如果如上面的例子loadVideo和playVideo都需要各自添加，需要写多次该方法。

而动态代理就不需要了。

java的java.lang.reflect包下提供了一个Proxy类和一个InvocationHandler(调用处理程序)接口，通过这个类和这个接口可以生成JDK动态代理类和动态代理对象。

创建一个MyInvocationHandler实现InvocationHandler接口，该类持有一个被代理对象的实例target,InvocationHandler中有一个invoke方法，所有执行代理对象的方法都会被替换成执行invoke方法。

```java
public class MyInvocationHandler<T> implements InvocationHandler {
   //invocationHandler持有的被代理对象
    T target;

    public MyInvocationHandler(T target) {
       this.target = target;
    }

    /
     * proxy:代表动态代理对象
     * method：代表正在执行的方法
     * args：代表调用目标方法时传入的实参
     */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("代理执行" +method.getName() + "方法");
     */
        //代理过程中插入方法handleMethod()
        handleMethod();
        Object result = method.invoke(target, args);
        return result;
    }
}
```

```java
public class ProxyTest {
    public static void main(String[] args) {

        //创建一个实例对象，这个对象是被代理的对象
        IPlayer player = new MyPlayer();

        //1.创建一个与代理对象相关联的InvocationHandler
        InvocationHandler playerHandler = new MyInvocationHandler<IPlayer>(player);
        //2.创建一个代理对象playerProxy，代理对象的每个执行方法都会替换执行Invocation中的invoke方法
        IPlayer playerProxy= (IPlayer) Proxy.newProxyInstance(IPlayer.class.getClassLoader(), new Class<?>[]{IPlayer.class}, palyerHandler);
        playerProxy.loadVideo("aaa.mp4");
        playerProxy.playVideo("aaa.mp4");
    }
}
```

上述创建动态代理对象的过程也可以拆解为

```java
//1.创建一个与代理对象相关联的InvocationHandler
InvocationHandler playerHandler = new MyInvocationHandler<IPlayer>(player);
//2.使用Proxy类的getProxyClass静态方法生成一个动态代理类playerProxyClass
Class<?> playerProxyClass = Proxy.getProxyClass(IPlayer.class.getClassLoader(), new Class<?>[] {IPlayer.class});
//3.获得playerProxyClass中一个带有InvovationHandler参数的构造器constructor
Constructor<?> constructor = playerProxyClass.getConstructor(InvocationHandler.class);
//4.通过构造器constructor来创建一个动态实例playerProxy
IPlayer playerProxy = (IPlayer) constructor.newInstance(palyerHandler);
```

执行上述ProxyTest代码，我们创建了一个需要被代理的播放器player，将player对象传给了playerHandler中，我们在创建代理对象playerProxy时，将playerHandler作为参数了的，上面也有说到所有执行代理对象的方法都会被替换成执行invoke方法，也就是说，最后执行的是MyInvocationHandler中的invoke方法，最终发现在loadVideo和playVideo前都执行了handleMethod方法。

### 3、retrofit就是经典的动态代理、注解加反射实例
[Retrofit中的注解、反射与动态代理_retrofit operator代理-CSDN博客](https://blog.csdn.net/qq_35101450/article/details/123084879)

## 十八、单例
### 1、饿汉式
饿汉式单例在类加载时就进行对象实例化，因此不存在线程安全问题

```java
public class Singleton {
    // 私有静态变量，用于存储单例对象
    private static final Singleton instance = new Singleton();

    // 私有构造方法，防止外部直接创建对象
    private Singleton() {
        // 防止反射破坏单例
        if (instance != null) {
            throw new IllegalStateException("Already initialized.");
        }
    }

    // 提供一个公共的静态方法来获取单例对象
    public static Singleton getInstance() {
        return instance;
    }
}
```

1. `private static final Singleton instance = new Singleton();`在类加载时，`instance`会被初始化为一个`Singleton`对象。由于`instance`是`final`的，其值在初始化后不能被修改。
2. `private Singleton()`防止外部通过`new`关键字直接创建对象。同时，通过在构造方法中检查`instance`是否为`null`，可以防止反射破坏单例。
3. `public static Singleton getInstance()`用于获取单例对象。由于`instance`在类加载时已经初始化，因此每次调用`getInstance()`方法时都会返回同一个对象。

优点是实现简单、线程安全，但缺点是可能会占用不必要的资源，且灵活性较差，不能在需要的时候初始化单例。

### 2、懒汉式
核心思想是延迟初始化，即在第一次使用单例对象时才进行实例化。

```java
public class Singleton {
	// 私有静态变量，用于存储单例对象
	private static Singleton instance;
	// 私有构造方法，防止外部直接创建对象
	private Singleton() {}

	// 提供一个公共的静态方法来获取单例对象
	public static Singleton getInstance() {
		if (instance == null) {
			instance = new Singleton();
		}
		return instance;
	}
}
```

私有静态成员变量，当调用getInstance后instance被赋值，静态成员变量是属于类的，被赋值后所有实例共享，但是上述代码在单线程下是安全的，多线程下不安全，需要加锁

```java
public class Singleton {
    // 使用volatile关键字修饰，确保多线程环境下的可见性和禁止指令重排序
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null)  { // 第一次检查
            synchronized (Singleton.class) { // 加锁
                if (instance == null) { // 第二次检查
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

## 十九、内部类
内部类是一个十分独特且强大的结构，它允许在一个外部类的内部定义另一个类。这种结构不仅增加了代码的封装性，还提供了访问外部类的私有成员的能力，从而在某些情况下简化了代码设计。

内部类的概念：

+ 内部类是指在一个外部类的内部定义的类。它可以访问包含它的外部类的所有成员，包括私有成员。
+ 内部类可以定义为非静态或静态。非静态内部类持有外部类的引用，而静态内部类则不需要。

内部类的分类： 成员内部类、局部内部类、静态内部类、匿名内部类

### 1、成员内部类
成员内部类（Member Inner Class）是指在一个外部类的内部定义的类。成员内部类和外部类有着紧密的联系，能够访问外部类的所有成员，包括私有成员。成员内部类通常用来逻辑上关联外部类，并且可以更好地封装数据和行为。

特点

1. 访问权限：成员内部类可以访问外部类的所有成员（包括私有成员）。
2. 与外部类实例的关联：成员内部类的实例与创建它的外部类实例相关联。要创建成员内部类的实例，必须首先创建一个外部类的实例。
3. 外部类引用：成员内部类可以使用 `OuterClass.this`来引用外部类的实例。

```java
public class OuterClass {
    private String name = "外部类";

    public void printName() {
        System.out.println("外部类名称： " + name);
    }

    class InnerClass {
        public void accessOuterClass() {
            System.out.println("内部类访问外部类成员：");
            System.out.println("外部类名称： " + OuterClass.this.name);
            OuterClass.this.printName();
        }
    }

    public static void main(String[] args) {
        OuterClass outer = new OuterClass();
        OuterClass.InnerClass inner = outer.new InnerClass();
        inner.accessOuterClass();
    }
}
```

`InnerClass`通过`OuterClass.this.name`和`OuterClass.this.printName()`访问了外部类`OuterClass`的成员变量和方法。

实例化方式：要实例化成员内部类，必须先实例化外部类，然后使用外部类的实例来实例化内部类。

### 2、局部内部类
局部内部类（Local Inner Class）是定义在一个方法、构造器或代码块中的类。局部内部类只能在其定义的范围内使用，并且通常用于封装仅在该方法中需要的逻辑。局部内部类可以访问外部类的成员变量和方法，但外部类不能直接访问局部内部类的成员。

特点

1. 局部内部类只能访问外部类的 final 变量或者实际上不变的变量。
2. 局部内部类可以直接访问外部类的成员，包括私有成员。
3. 局部内部类不能含有 static 的变量和方法。

注意

1. 局部内部类的定义必须在方法内部，不能在类的其他部分定义。
2. 局部内部类的对象创建时机是在方法调用时，随方法执行完毕而销毁。

```java
// 定义一个名为OuterClass的外部类
public class OuterClass {
    // 定义一个私有成员变量name，并初始化为"外部类"
    private String name = "外部类";

    // 定义一个公共方法printName()，用于打印name的值
    public void printName() {
        System.out.println("外部类名称： " + name);
    }

    // 定义一个公共方法method()
    public void method() {
        // 在method()方法中定义一个局部内部类LocalInnerClass
        class LocalInnerClass {
            // 定义一个私有成员变量innerName，并初始化为"局部内部类"
            private String innerName = "局部内部类";

            // 定义一个公共方法printInnerName()，用于打印innerName和访问外部类成员
            public void printInnerName() {
                System.out.println("局部内部类名称： " + innerName);
                System.out.println("访问外部类成员： " + name);
                printName();
            }
        }

        // 创建LocalInnerClass的一个实例localInner
        LocalInnerClass localInner = new LocalInnerClass();
        // 调用localInner的printInnerName()方法
        localInner.printInnerName();
    }

    // 定义主方法main()
    public static void main(String[] args) {
        // 创建OuterClass的一个实例outer
        OuterClass outer = new OuterClass();
        // 调用outer的method()方法
        outer.method();
    }
}
```

这段代码定义了一个名为OuterClass的外部类，其中包含一个私有成员变量name和一个公共方法printName()。在method()方法中，定义了一个局部内部类LocalInnerClass，该类包含一个私有成员变量innerName和一个公共方法printInnerName()。在main()方法中，创建了OuterClass的一个实例outer，并调用其method()方法。

### 3、静态内部类
静态内部类（Static Nested Class）是在外部类中使用 static 修饰符定义的内部类。与非静态内部类不同，静态内部类不需要外部类的实例即可创建。静态内部类通常用于外部类的逻辑分组，并且可以访问外部类的静态成员。静态内部类是定义在另一个类中的静态类。它类似于顶级类，但被嵌套在另一个类中。静态内部类不依赖于外部类的实例，可以直接创建。

注意：

1. 成员访问限制： 静态内部类不能直接访问外部类的非静态成员。如果需要访问，可以通过外部类的实例来实现。
2. 静态上下文： 静态内部类本身是在静态上下文中定义的，因此它的所有直接成员（字段和方法）也必须是静态的，除非在实例方法中访问。

```java
public class OuterClass {
    private static String staticOuterField = "Static Outer Field";
    private String instanceOuterField = "Instance Outer Field";

    // 静态内部类
    public static class StaticInnerClass {
        private String innerField = "Inner Field";

        public void display() {
            // 访问外部类的静态成员
            System.out.println("Static Outer Field: " + staticOuterField);
            // 不能直接访问外部类的非静态成员
            // System.out.println("Instance Outer Field: " + instanceOuterField); // 错误
        }

        // 静态内部类中的静态方法
        public static void staticDisplay() {
            // 访问外部类的静态成员
            System.out.println("Static Outer Field: " + staticOuterField);
        }
    }

    public static void main(String[] args) {
        // 创建静态内部类的实例
        StaticInnerClass inner = new StaticInnerClass();
        inner.display();

        // 调用静态内部类的静态方法
        StaticInnerClass.staticDisplay();
    }
}
```

这段代码定义了一个名为OuterClass的外部类，其中包含一个静态成员变量staticOuterField和一个实例成员变量instanceOuterField。在OuterClass中还定义了一个静态内部类StaticInnerClass，该类包含一个成员变量innerField和两个方法display()和staticDisplay()。在main()方法中，创建了StaticInnerClass的一个实例inner，并调用了其display()方法和StaticInnerClass的静态方法staticDisplay()。

### 4、匿名内部类
匿名内部类（Anonymous Inner Class）是没有名字的内部类，通常用于简化代码，只在某个特定场景下使用一次。

匿名内部类可以用来继承一个类或实现一个接口。匿名内部类定义在方法、构造器或初始化块中，用于即时实例化一个对象。

匿名内部类通常用于需要快速创建类的实例并覆盖其方法的情况。

注意：

1. 访问局部变量： 匿名内部类可以访问包含它的作用域中的局部变量，但这些变量必须是 `final` 或有效 `final`。
2. 构造器： 匿名内部类没有构造器，可以通过初始化块来初始化实例变量。
3. 限制： 由于匿名内部类没有名字，不能在定义之外的其他地方引用或复用它们。

> 匿名内部类是一种简化代码的方式，用于即时创建类的实例并覆盖其方法。它没有名字，通常只在创建它的地方使用一次。匿名内部类可以继承一个类或实现一个接口，可以访问外部类的成员变量和包含它的局部变量（这些变量必须是 final 或有效 final）。匿名内部类在简化代码、封装临时逻辑方面非常有用。
>

```java
public class OuterClass {
    private String outerField = "Outer Field";

    public void outerMethod() {
        final String localVar = "Local Variable";  // 局部变量，必须是 final 或有效 final

        // 使用匿名内部类创建线程
        Thread thread = new Thread() {
            @Override
            public void run() {
                // 访问外部类的成员
                System.out.println("Outer Field: " + outerField);
                // 访问局部变量
                System.out.println("Local Variable: " + localVar);
            }
        };
        thread.start();

        // 使用匿名内部类实现接口
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                // 访问外部类的成员
                System.out.println("Outer Field: " + outerField);
                // 访问局部变量
                System.out.println("Local Variable: " + localVar);
            }
        };
        new Thread(runnable).start();
    }

    public static void main(String[] args) {
        OuterClass outer = new OuterClass();
        outer.outerMethod();
    }
}
```

匿名内部类：这里定义了一个实现 Runnable 接口的匿名内部类，并重写了其 run 方法。该匿名内部类在创建的同时定义并实例化。

访问外部类成员：匿名内部类能够直接访问外部类的私有成员 outerField。

访问局部变量：匿名内部类能够访问方法内的局部变量 localVar，因为它是 final 的。

启动线程：创建一个新的 Thread 实例，并将 Runnable 类型的匿名内部类实例 runnable 传递给 Thread 构造器，随后调用 start 方法启动线程，这会调用 run 方法。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542617414-598a9e12-8a84-4ee8-903a-2201e7689cf1.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542661545-ba6b0d41-c11e-4d9e-bab8-124d87e57c4f.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542679061-923c56ab-933e-48e9-9384-d2829fbf5776.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542690619-54ff831c-0361-4167-90cd-b030d0b0cf6b.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542702538-998a84ae-14d8-4fd9-a3ca-f52638a50b78.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542711433-9e68ce10-08f1-44df-841e-84ff74183328.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542720022-aad16f21-5d58-4ee1-81b1-96b4c9ea24db.png)

## 二十、static变量可以被回收吗
`static`变量通常指的是静态变量，它们属于类而不是类的某个特定实例。静态变量的生命周期与类的生命周期相同，也就是说，它们在类被加载时创建，并在类被卸载时销毁。

## 二十一、static修饰的作用和好处
`static`关键字用于声明静态变量、静态方法、静态代码块和静态内部类

静态变量

+ 类级别共享：静态变量属于类本身，而不是类的某个特定实例。因此，所有实例共享同一个静态变量，这使得静态变量非常适合用于存储类级别的数据。
+ 内存效率：静态变量在类加载时初始化一次，并且在类的生命周期内一直存在。这避免了为每个实例分配单独的内存，从而提高了内存效率。
+ 全局访问：静态变量可以通过类名直接访问，无需创建类的实例。这使得静态变量可以作为全局变量使用，方便在多个地方访问和修改。

静态方法

+ 类级别方法：静态方法属于类本身，而不是类的某个特定实例。因此，静态方法可以通过类名直接调用，无需创建类的实例。
+ 工具方法：静态方法非常适合用于实现工具类，这些方法不需要访问类的实例变量，可以独立运行。
+ 性能优化：静态方法在调用时不需要创建对象，因此调用速度快，性能更好。

静态代码块

+ 初始化：静态代码块在类加载时执行一次，非常适合用于类级别的初始化操作，如加载资源、初始化静态变量等。
+ 顺序执行：静态代码块的执行顺序在静态变量初始化之后，构造方法调用之前。

静态内部类

+ 独立访问：静态内部类可以独立于外部类的实例存在，可以直接通过外部类的名称访问。
+ 资源隔离：静态内部类可以有自己的静态变量和静态方法，不会与外部类的实例变量和方法冲突。
+ 性能优化：静态内部类在调用时不需要创建外部类的实例，因此调用速度快，性能更好。

总结

+ 静态变量：类级别共享，内存效率高，全局访问方便。
+ 静态方法：类级别方法，工具方法实现，调用速度快。
+ 静态代码块：类加载时初始化，顺序执行。
+ 静态内部类：独立访问，资源隔离，调用速度快。

