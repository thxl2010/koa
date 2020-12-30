# [koa](https://www.koajs.com.cn/)

> [koa](https://github.com/koajs/koa) 应用是一个包含一系列中间件 generator 函数的对象。 这些中间件函数基于 request 请求以一个类似于栈的结构组成并依次执行。

> [middleware](https://github.com/koajs/koa/wiki#middleware)

> [koa-docs-Zh-CN](https://github.com/demopark/koa-docs-Zh-CN)

> [Koa 框架教程\_阮一峰](http://www.ruanyifeng.com/blog/2017/08/koa.html)

> [Egg.js](https://github.com/eggjs/egg)

## Installation

```sh
# Koa requires node v7.6.0 or higher for ES2015 and async function support.
npm install koa
```

## Server

```js
const Koa = require('koa');
const app = new Koa();

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
```

## [Middleware](https://github.com/demopark/koa-docs-Zh-CN/blob/master/guide.md)

### `async` functions (node v7.6+)

```js
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
```

### Common function

```js
// Middleware normally takes two parameters (ctx, next), ctx is the context for one request,
// next is a function that is invoked to execute the downstream middleware. It returns a Promise with a then function for running code after completion.

app.use((ctx, next) => {
  const start = Date.now();
  return next().then(() => {
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
});
```
