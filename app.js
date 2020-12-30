/*
 * [koa](https://www.koajs.com.cn/)
 * @Author: Duyb
 * @Date: 2020-12-29 14:18:09
 * @Last Modified by: Duyb
 * @Last Modified time: 2020-12-30 14:30:45
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const Koa = require('koa');
const compose = require('koa-compose');
const route = require('koa-route');
const koaBody = require('koa-body');
const serve = require('koa-static');

const app = new Koa();

// ! 处理错误的中间件: 可以让最外层的中间件，负责所有中间件的错误处理
const handler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = {
      message: err.message
    };

    // ! 释放 error 事件 : 需要注意的是，如果错误被 try...catch 捕获，就不会触发error事件。
    // 这时，必须调用 ctx.app.emit()，手动释放error事件，才能让监听函数生效
    ctx.app.emit('error', err, ctx);
  }
};
app.use(handler);

// ! error 事件
app.on('error', function (err) {
  console.log('logging error ', err.message);
  console.log(err);
});

// ! static
const publicFiles = serve(path.join(__dirname, 'public'));
publicFiles._name = 'static /public';

app.use(publicFiles);

// ! [Middleware](https://github.com/koajs/koa#middleware)
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`> : ${ctx.method} ${ctx.url} - ${ms}ms`);
});

// [中间件参数](https://github.com/demopark/koa-docs-Zh-CN/blob/master/guide.md#%E4%B8%AD%E9%97%B4%E4%BB%B6%E5%8F%82%E6%95%B0)
function logger(format) {
  format = format || ':method ":url"';

  return async function (ctx, next) {
    const str = format.replace(':method', ctx.method).replace(':url', ctx.url);

    console.log(str);

    await next();
  };
}

app.use(logger());
app.use(logger(':method :url'));

// ! 中间件的合成: koa-compose
async function random(ctx, next) {
  if (ctx.path === '/random') {
    ctx.body = Math.floor(Math.random() * 10);
  } else {
    await next();
  }
}

async function backwards(ctx, next) {
  if (ctx.path === '/backwards') {
    ctx.body = 'sdrawkcab';
  } else {
    await next();
  }
}

async function pi(ctx, next) {
  if (ctx.path === '/pi') {
    ctx.body = String(Math.PI);
  } else {
    await next();
  }
}

const all = compose([random, backwards, pi]);

app.use(all);

// ! post
// upload: { multipart: true }
app.use(koaBody({ multipart: true }));

// ! koa-route
const about = ctx => {
  ctx.response.type = 'html';
  ctx.response.body = '<a href="/">Index Page</a>';
};
app.use(route.get('/about', about));
app.use(route.get('/about2', about));

// redirect
const redirect = ctx => {
  ctx.response.redirect('/');
  ctx.response.body = '<a href="/">Index Page</a>';
};

app.use(route.get('/redirect', redirect));

// ! 异步中间件: read dir
// app.use(async function (ctx, next) {
//   const paths = await fs.readdir('docs');
//   const files = await Promise.all(
//     paths.map(path => fs.readFile(`docs/${path}`, 'utf8'))
//   );

//   ctx.type = 'markdown';
//   ctx.body = files.join('');
// });

// ! error

const error500 = ctx => {
  ctx.throw(500);
};

const error404 = ctx => {
  ctx.response.status = 404;
  ctx.response.body = 'Page Not Found';
};

app.use(route.get('/500', error500));
app.use(route.get('/404', error404));

// ! post body
const postBody = async function (ctx) {
  const body = ctx.request.body;
  if (!body.name) ctx.throw(400, 'name required');
  ctx.body = { name: body.name };
};

// ! koaBody
// test: curl --data "name=Jack" -X POST 127.0.0.1:3000/post
app.use(route.post('/post', postBody));

// ! koaBody upload : app.use(koaBody({ multipart: true }));
const upload = async function (ctx) {
  const tmpdir = os.tmpdir();
  const filePaths = [];
  const files = ctx.request.body.files || {};

  for (let key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const file = files[key];
      const filePath = path.join(tmpdir, file.name);
      const reader = fs.createReadStream(file.path);
      const writer = fs.createWriteStream(filePath);
      reader.pipe(writer);
      filePaths.push(filePath);
    }
  }

  ctx.body = filePaths;
};
// test : curl --form upload=@/path/to/file http://127.0.0.1:3000/upload
app.use(route.post('/upload', upload));

app.use(async ctx => {
  // console.log('>>> ctx :', ctx);
  // console.log('\n>>> Object.entries(ctx) : ', Object.entries(ctx), '\n');
  // console.log(
  //   '\n>>> 与 Request 等价： ctx.path : ',
  //   ctx.path,
  //   ', ctx.request.path :',
  //   ctx.request.path,
  //   '\n'
  // );
  // console.log('>>> 应用实例引用 ctx.app :', ctx.app);

  // console.log('>>> Koa 的 Request 对象 ctx.request :', ctx.request);
  // console.log('>>> Koa 的 Response 对象 ctx.response :', ctx.response);

  // console.log('>>> ctx.path :', ctx.path);
  // console.log('>>> ctx.method  :', ctx.method);
  // console.log('>>> node IncomingMessage ctx.req  :', ctx.req);
  // console.log('>>> node ServerResponse ctx.res  :', ctx.res);

  // 推荐的命名空间，用于通过中间件传递信息到前端视图
  // ctx.state.user = await User.find(id);
  // console.log('>>> ctx.state  :', ctx.state);

  // ctx.cookies.set(name, value, [options])
  ctx.cookies.set('name', 'du');
  const cookieOfName = ctx.cookies.get('name');
  console.log("cookieOfName ctx.cookies.get('name') :", cookieOfName);

  // request.is(types...)
  // console.log("ctx.is('html') :", ctx.is('html'));

  // ! 中间件决定响应请求，并希望绕过下游中间件可以简单地省略 next()
  ctx.body = 'hello world !';
});

console.log('app.env :', app.env);
console.log('app.proxy :', app.proxy);
console.log('app.subdomainOffset  :', app.subdomainOffset);

app.listen(3000);
// 等价于
// http.createServer(app.callback()).listen(3000);
// 这意味着您可以同时支持 HTTPS 和 HTTPS，或者在多个端口监听同一个应用。
// https.createServer(app.callback()).listen(3001);
