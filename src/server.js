var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var cm = require('./msg_model');
var TYPE = ['上线','下线','发送消息','设置'];
var PORT = 7;

var clients = {
    count: 0, /*当前在线人数*/
    list:[] /*在线人数清单 */
};
/**
 * 创建一个客户
 * @param  {[type]} port    [description]
 * @param  {[type]} address [description]
 * @return {[type]}         [description]
 */
clients.create_client = function(name, port, address){
    var client = {
        "name": name,
        "port": port,
        "address": address
    };
    
    clients.count++;
    
    clients.list.push(client);
    
};

clients.out_client = function(port, address){
    var temp = this.find_client(port, address);
    if(temp !== null){
        clients.count--;
        return clients.list.splice(clients.list.indexOf(temp), 1);

    }else{
        console.log("【出现错误】:不存在的用户退出该聊天室");
        return null;
    }
};

clients.find_client_by_name = function(name){
    for(var i = 0 ; i < clients.count; i++){
        if(name === clients.list[i].name){
                return clients.list[i];
            }
    }
    return null;
}

clients.find_client = function(port, address){
    for(var i = 0 ; i < clients.count; i++){
        if(address === clients.list[i].address
            && port === clients.list[i].port){
                return clients.list[i];
            }
    }
    return null;
}
clients.check_in_client = function(port, address){
    if(this.find_client(port, address) === null){
        return false;
    }
    return true;
}
exports.clients = clients;

var t = 1;


 function sendMsg(msg, client){
    // console.log('[test] in sendMsg');
    // console.log(client.count);
    client = client === null?clients:client;
    for(var i = 0; i < client.count; i++){-
        server.send(msg, 0, msg.length, client.list[i].port, client.list[i].address, function(err){
        });
    }
}
function newOnline(m, port, address){
    //将上线的信息补充完整然后发送回去。
    try{
        m.from["port"] = port;
        
        m.from["address"] = address;
        
        clients.create_client(m.from["name"], port, address);
        
        var back = "用户 " + m.from.name + " 上线, 当前用户" + clients.count + "人";
        
        var message = new cm.Message(m.from, m.to, back, TYPE[0]);
        //先发送给原来的对象你的是address和port是哪个
        
        sendMsg(new Buffer(message.serialize()), clients);
    }catch(er){
        console.log("[error]:server newOnline");
    }
}
function newOffline(m, port, address){
    //将上线的信息补充完整然后发送回去。
    try{
        clients.out_client(port, address);
        var back = "用户 " + m.from.name + " 下线, 当前用户" + clients.count + "人";
        var message = new cm.Message(m.from, m.to, back, TYPE[1]);
        //先发送给原来的对象你的是address和port是哪个
        sendMsg(new Buffer(message.serialize()), clients);
    }catch(er){
        console.log("[error]:server newOnline");
    }
}
/**
 * 有信息到达的时候会调用这个message事件
 * @param  {Buffer} 'message'     客户端发送过来的数据
 * @param  {[type]} function(msg, rinfo       携带了远程主机的信息
 * @return {[type]}               [description]
 */
    server.on('message', function(msg, rinfo){
        var m = JSON.parse(msg.toString());
        var port = rinfo.port.toString();
        var address = rinfo.address.toString();
        if(m.type === TYPE[0]){
            if(clients.check_in_client(port, address) === false){
                //新用户上线
                newOnline(m, port, address);
                return ;
            }
        }
        //用户退出
        if(m.type === TYPE[1]){
            newOffline(m, port, address);
            return;
        }

        // 发送信息
        if(m.type === TYPE[2]){
            sendMsg(new Buffer(msg.toString()), clients);
        }

    }).bind(PORT,function(){
        console.log('服务器启动成功');
    });