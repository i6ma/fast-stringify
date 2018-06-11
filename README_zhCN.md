# fast-stringify
## 快速序列化

[快的离谱](#速度大比拼)，能安全处理循环引用的序列化工具

## 目录

- [如何使用](#如何使用)
  - [参数定义](#参数定义)
- [速度大比拼](#速度大比拼)
  - [处理简单数据](#处理简单数据)
  - [处理复杂数据](#处理复杂数据)
  - [处理循环引用](#处理循环引用)
  - [处理特殊对象](#处理特殊对象)
- [开发概要](#开发概要)

## 如何使用

```javascript
import stringify from "fast-stringify";

const object = {
  foo: "bar",
  deeply: {
    recursive: {
      object: {}
    }
  }
};

object.deeply.recursive.object = object;

console.log(stringify(object));
// {"foo":"bar","deeply":{"recursive":{"object":"[ref-0]"}}}
```

#### 参数定义

`stringify(object: any, replacer: ?function, indent: ?number, circularReplacer: ?function): string`

基于所传的参数，将对象序列化。`object`是唯一的必选参数，后面的可选参数能自定义序列化的细则。

- `replacer` => 回调函数，用于自定义具体如何序列化每个值（详情请参考 [JSON.stringify 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Parameters)）
- `indent` => 数字，指定缩进空格的个数，用于美化输出（详情请参考 [JSON.stringify 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Parameters)）
- `circularReplacer` => 回调函数，用于自定义具体如何处理循环引用的值（缺省为 `[ref-##]` 其中 `##` 表示发现循环引用的次数）

## 速度大比拼
### Benchmarks 基准测试

#### 处理简单数据

_属性数量较少，所有的值都是简单的原始类型_

|                            | 每秒处理次数        | 相对误差                 |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **627,191**         | **0.83%**                |
| fast-json-stable-stringify | 358,901             | 0.87%                    |
| json-stringify-safe        | 295,582             | 0.71%                    |
| json-stable-stringify      | 270,825             | 0.77%                    |
| json-cycle                 | 200,950             | 0.81%                    |
| decircularize              | 132,202             | 1.09%                    |

#### 处理复杂数据

_属性数量较多，值中混杂着多种数据类型，较复杂的复合结构_

|                            | 每秒处理次数        | 相对误差                 |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **116,915**         | **0.61%**                |
| fast-json-stable-stringify | 58,603              | 0.80%                    |
| json-cycle                 | 54,115              | 0.80%                    |
| json-stringify-safe        | 53,851              | 0.71%                    |
| json-stable-stringify      | 42,827              | 1.27%                    |
| decircularize              | 23,565              | 0.86%                    |

#### 处理循环引用

_具有深层嵌套、循环引用的对象_

|                                            | 每秒处理次数        | 相对误差                 |
| ------------------------------------------ | ------------------- | ------------------------ |
| **fast-stringify**                         | **106,302**         | **0.74%**                |
| json-stringify-safe                        | 50,535              | 0.64%                    |
| json-cycle                                 | 50,418              | 0.89%                    |
| decircularize                              | 21,536              | 0.94%                    |
| fast-json-stable-stringify (not supported) | 0                   | 0.00%                    |
| json-stable-stringify (not supported)      | 0                   | 0.00%                    |

#### 处理特殊对象

_诸如 React 组件，自定义构造器，等特殊对象_

|                            | 每秒处理次数        | 相对误差                 |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **30,971**          | **0.83%**                |
| json-cycle                 | 21,324              | 0.82%                    |
| fast-json-stable-stringify | 17,909              | 1.04%                    |
| json-stringify-safe        | 17,522              | 0.74%                    |
| json-stable-stringify      | 13,938              | 1.05%                    |
| decircularize              | 7,438               | 0.64%                    |

## 开发概要

按常规套路，git clone 这个项目，执行 `npm i` 安装依赖，然后就可以使用下面这些 npm 脚本了。

- benchmark => 执行 benchmark 基准测试，和另外几个类似的工具比拼速度
- build => 使用 `rollup` 工具构建产出文件
- clean => 执行如下脚本：`clean:dist`, `clean:es`, `clean:lib`
- clean:dist => 使用 `rimraf` 工具清除 `dist` 目录
- clean:es => 使用 `rimraf` 工具清除 `es` 目录
- clean:lib => 使用 `rimraf` 工具清除 `lib` 目录
- dev => 基于 webpack 启动此项目，以便在浏览器中查看效果
- dist => 运行 `clean:dist` 和 `build` ，重新构建产出文件
- lint => 采用 ESLint 检查 `src` 目录下的所有文件（运行 `dev` 脚本时也会进行此项检查）
- lint:fix => 运行上面的 `lint` 脚本，并且开启 auto-fixer 选项
- prepublish:compile => 为发布作准备，依次运行 `lint`, `test:coverage`, `transpile:lib`, `transpile:es`, `dist` 这一系列脚本
- start => 同 `dev` 脚本
- test => 用 BABEL_ENV=test 这个环境变量，按照 `test` 目录下的所有文件进行 AVA 测试
- test:coverage => 同 `test` 脚本，但增加 `nyc` 代码覆盖率测试
- test:watch => 同 `test` 脚本，但会持续监听文件
- transpile:es => 用 Babel 工具处理 `src` 目录下的所有文件（不转换 ES2015 export 语法，转换后的文件输出到 `es` 目录）
- transpile:lib => 用 Babel 工具处理 `src` 目录下的所有文件（输出到 `lib` 目录）
