const { accountInfo } = require('./config/AccountConfig');

const {localServerDomain, localAssetsDomain, localServerPort, localAssetsPort, mainDomain} = accountInfo;
const { secretCode = "" } = accountInfo;

// const { localServerDomain, localAssetsDomain, localServerPort, localAssetsPort, mainDomain } = require('./bin/domain')
// const { secretCode = "" } = require('./bin/purchaseCode')

if (localServerDomain.indexOf("http://") != -1 || localServerDomain.indexOf("https://") != -1) {
  console.log("\x1b[91m%s\x1b[0m", "域名配置不要加上 http协议前缀，标准格式为：www.baidu.com 或者 www.baidu.com:8011")
  return
}

if (localAssetsDomain.indexOf("http://") != -1 || localAssetsDomain.indexOf("https://") != -1) {
  console.log("\x1b[91m%s\x1b[0m", "域名配置异常")
  console.log("域名配置不要加上 http协议前缀，标准格式为：www.baidu.com 或者 www.baidu.com:8010")
  return
}

if (localServerPort != "8015" || localAssetsPort != "8014") {
  console.log("\x1B[33m%s\x1b[0m", "您没有使用标准端口号8014、8015，请确认你已经了解了端口号的配置规则。随意更改端口号可能导致服务无法正常运行。")
}

/**
  * 配置日志服务的域名!!!
  * 默认是demo域名：demo_server_domain
  * 本地或线上请使用：local_server_domain
  */
const default_api_server_url = localServerDomain.length ? "//" + localServerDomain : ""

/**
  * 配置可视化平台的域名!!!
  * 本地请使用 "localhost"
  */
// 默认为本地部署
const default_assets_url = "" // "//" + localAssetsDomain

/*
 * 删除文件夹下所有文件
 * @param{ String } 目录
 */
var delDir = function(path) {
  let files = [];
  if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
          let curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()){
              delDir(curPath); //递归删除文件夹
          } else {
              fs.unlinkSync(curPath); //删除文件
          }
      });
      fs.rmdirSync(path);
  }
}

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */

var copy = function( src, dst ){
  // 读取目录中的所有文件/目录
  fs.readdir( src, function( err, paths ){
      if( err ){ throw err; }
        paths.forEach(function( path ){
          var _src = src + '/' + path,
              _dst = dst + '/' + path,
              readable, writable;      
          stat( _src, function( err, st ){
              if( err ){ throw err; }
              // 判断是否为文件
              if( st.isFile() ){
                  // 创建读取流
                  readable = fs.createReadStream( _src );
                  // 创建写入流
                  writable = fs.createWriteStream( _dst ); 
                  // 通过管道来传输流
                  readable.pipe( writable );
              }
              // 如果是目录则递归调用自身
              else if( st.isDirectory() ){
                  exists( _src, _dst, copy );
              }
          });
      });
  });
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function( src, dst, callback ){
  fs.exists( dst, function( exists ){
      // 已存在
      if( exists ){
          callback( src, dst );
      }
      // 不存在
      else{
          fs.mkdir( dst, function(){
              callback( src, dst );
          });
      }
  });
};

var fs = require('fs');
stat = fs.stat;
delDir(__dirname + "/views/webfunny_event")
fs.mkdir( __dirname + "/views/webfunny_event", function(err){
  if ( err ) { 
    console.log("= 文件夹 /views/webfunny_event 已经存在")
  } else {
    console.log("= 创建文件夹 /views/webfunny_event")
  }
});

// 生成探针结束
copy(__dirname + "/views/resource/", __dirname + "/views/webfunny_event")
copy(__dirname + "/views/images/", __dirname + "/views/webfunny_event")
console.log("= 正在执行编译，请稍等...")
setTimeout(function() {
  let path = __dirname + '/views/webfunny_event/js';
  let files = fs.readdirSync(path);
  for(let i = 0; i < files.length; i++){
    if ( !(files[i].indexOf(".js") >= 0 || files[i].indexOf(".html") >= 0) ) {
      continue
    }
    fs.readFile(`${path}/${files[i]}`,function(err, data){
        if (data.indexOf("default_api_server_url") >= 0 || data.indexOf("default_assets_url") >= 0 ) {
          let newString = data.toString().replace(/default_api_server_url/g, default_api_server_url).replace(/default_assets_url/g, default_assets_url).replace(/default_api_server_port/g, localServerPort).replace(/webfunny_secret_code/g, secretCode)
          fs.writeFile(`${path}/${files[i]}`, newString, (err) => {
            if (err) throw err;
            console.log("= " + files[i] + "  接口域名配置成功！");
          });
        }
    })
  }

}, 3000)
