/**
 * 渲染视图
 */
    var cm = require('./msg_model');
    var dgram = require('dgram');
    var socket = dgram.createSocket('udp4');  //socket字符串
    var readline = require('readline'); /*逐行读取一个流内容*/
    var TYPE = ['上线','下线','发送消息','设置'];
    var Keypress = require("keypress");

    // var clients = require('./server').clients;
    var _ignoreCtrlC = false;
    function CtrlC(ign) {
        _ignoreCtrlC = ign;
    }
    var server = cm.server; //引用服务器端的server
    var rl = readline.createInterface({ //控制套输入输出的接口
        input: process.stdin,
        output: process.stdout
    });
// 这一个触发了两次输出
// Keypress(process.stdin);
    function Client(name, socket, from){
        var _this = this;
        this.socket = socket;
        this.to = {
            name: "all",
            port: server.port,
            address: server.address
        };  //默认是群发
        this.from = from;
        this.getfrom = function(){
            var _this = this;
            return JSON.stringify(_this.from);
        };
        this.setMessage = function(content){
            this.message.setContent(content);
        };
        this.show = function(){  //展示的信息
            try{
                var _this = this;
                console.log("from: " + JSON.stringify(_this.from));
                console.log("to: " + JSON.stringify(_this.to));
                console.log("message: " + JSON.stringify(_this.message));
            }catch(er){
                console.log("[error]: client.show");
            }
        };
        /** 发送信息 **/
        this.sendMessage =  function(content, to, type, callback){
            try{
                var _this = this;
                var message = null;
                if(to === null){
                    message = new cm.Message(_this.from, _this.to, content, type);
                }else{
                    message = new cm.Message(_this.from, to, content, type);
                }
                    var bf = new Buffer(message.serialize());
                this.socket.send(bf, 0, bf.length, server.port, server.address, callback);
            }catch(er){
                console.log("[error]: client.sendMessage");

            }
        };
    };
    socket.bind(1234,'localhost', function(){
        console.log('[system]port:' + socket.address().port);
        rl.write("你的名字：");
        rl.resume();
        var temp = function(cmd){
            // 上线：
            var name = cmd.slice(cmd.indexOf('：')+1);
            user = new Client(cmd, socket, {
                name : name,
                port : socket.address().port,
                address : socket.address().address
            });

            // 发送上线的信息给服务器
            user.sendMessage('', user.to, TYPE[0], function(){
            });
        }
        var data = function(cmd){
                // 单发
            var str = cmd;
            var temp = null;
            var name = null;
            var cli = null;
            if(cmd.indexOf('@') !== -1){
                // console.log("[系统信息]: 单发");
                // 缺少了一个查找单个用户的东西
                // 然后这里的user.to应该是单个的user.name
                temp = cmd.match(/@[\S]*[\s]/)[0];
                name = temp.replace('@','').replace(' ', '');
                // cli = clients.find_client_by_name(name);
                str = cmd.slice(cmd.indexOf(temp[0]) + temp.length);
                console.log('[test]' + str);
                console.log('[test]' + JSON.stringify(cli) );
                user.sendMessage(str, cli, TYPE[2], function(){});
                return ;
            }else{
                // 群发
                user.sendMessage(str, null, TYPE[2], function(){});
                return ;
            }
        };
        rl.on('line', function(cmd){
            temp(cmd);
            temp = data;
        });
    }).on('message', function(msg, rinfo){
        var str = JSON.parse(msg.toString());
        var type = str.type;
        if(type === TYPE[0] ){
            // 上线信息
            console.log(str.content);
            rl.resume();
        }else if(type === TYPE[1]){
            // 下线
            console.log(str.content);

        }else if(type === TYPE[2]){
            // 判断行为
            if(str.from["port"] === socket.address().port
                && str.from["address"] === socket.address().address){
                    //自己群发的信息
                    if(str.to["port"] === server["port"]
                        && str.to["address"] === server["address"]){
                    console.log("你 : " + str["content"]);
                    }else{
                        //自己发给别人的信息
                        console.log("你 @ " + str.to["name"]+ " : " + str["content"]);
                    }
            }else {
                if(str.to["port"] === server["port"]
                    && str.to["address"] === server["address"]){
                    //别人群发的信息
                    console.log(str.from["name"] + " : " + str["content"]);
                }else if(str.to["port"] === socket.address().port
                    && str.to["address"] === socket.address().address){
                    //别人@你
                    console.log(str.from["name"] + " @ 你" + " : " + str["content"]);
                }
            }
        }else if(type === TYPE[3]){  //设置，添加别人和自己的上线的name port，server
            // code ...
        }else{
            // console.log("type4"); //出错了，用户的权限不够
            console.log("该用户权限不够");
        }
    });

/**用户推出的时候触发，异步方法执行不了 **/

    process.on('uncaughtException', function (err) {
        console.error('发生未知错误!');
        // console.log(err.stack);
        // var message = ;
        var bf = new Buffer(new cm.Message(user.from, user.to, "", TYPE[1]).serialize());
        socket.send(bf, 0, bf.length, server.port, server.address, function(){
            process.abort();
        });
    });

    process.on('SIGINT', function() {
        var message = new cm.Message(user.from, user.to, "", TYPE[1]);
        var bf = new Buffer(message.serialize());
        socket.send(bf, 0, bf.length, server.port, server.address, function(){
            process.abort();
            
        });
        // return false;
    });

    rl.input.on("keypress", function (ch, key) {
        if (!_ignoreCtrlC && key && key.name === "c" && key.ctrl) {
            var message = new cm.Message(user.from, user.to, "", TYPE[1]);
            var bf = new Buffer(message.serialize());
            socket.send(bf, 0, bf.length, server.port, server.address, function(){
                process.abort();
            });
        }
    });