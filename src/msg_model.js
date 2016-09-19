var SERVER = {
    port: '7',
    address: '127.0.0.1'
}; /*服务器端*/

/**
 * 消息的类
 * @param {Object} from    包含发送者的名字，端口，目的IP
 * @param {String|Object} to     "all"或 包含接受者的名字，端口，目的IP的对象
 * @param {String} content 发送内容
 * @param {Enum type} type  ['上线','下线','发送消息','设置'];
 */
function Message(from, to, content, type){
    this.from = from;
    this.to = to;
    this.content = content;
    this.type = type;
    this.setFrom = function(from){
        this.from = from;
    };
    this.setTo = function(to){
        this.to = to;
    };
    this.setContent = function(content){
        this.content = content;
    };
    this.setType = function(type){
        this.type = type;
    };
    /*** 将消息封装成为JSON字符串 ***/
    this.serialize = function(){
        var _this = this;
        var message = {
            from : _this.from,
            to  :  _this.to,
            content :  _this.content,
            type :  _this.type
        };
        // console.log(JSON.stringify(message));
        return JSON.stringify(message);
    };
}

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
exports.Message = Message;
exports.server = SERVER;
