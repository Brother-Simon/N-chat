$(document).ready(function() {
  //listen F5 keydown
  $(window).keydown(function (e) {
    if (e.keyCode == 116) {
      if (!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
        e.preventDefault();
      }
    }
  });

  function flushContentScroll(){
    $("#js_chat_content").scrollTop($("#js_contents").height());
  }

  //build chat dom
  function build_chat(from,msg,time,attr){
    var dom = "";
    switch (attr) {
      case 'self':
        dom = '<li class="current-user">';
        dom += build_chat_body(from,msg,time);
        dom += '</li>';
        return dom;
        break;
      case 'public':
        dom = '<li class="public">';
        dom += build_chat_body(from,msg,time);
        dom += '</li>';
        return dom;
        break;
      case 'system':
        dom = '<li class="system">';
        dom += build_chat_body(from,msg,time);
        dom += '</li>';
        return dom;
        break; 
    }
  }

  //build chat body
  function build_chat_body(from,msg,time){
    var dom = "";
      dom += '<span class="font_avator">'+from.charAt(0)+'</span>';
      dom += '<div class="bubble">';
        dom += '<a class="user-name" href="#">'+from+'</a>';
        dom += '<p class="message">';
          dom += msg;
        dom += '</p>';
        dom += '<p class="time">';
          dom += time;
        dom += '</p>';
      dom += '</div>';
    return dom;
  }

  var socket = io.connect();
  var from = $.cookie('user');//store user into cookie
  var to = 'all';
  socket.emit('online', {user: from});

  socket.on('online', function (data) {
    //show system info
    if (data.user != from) {
      var sys = build_chat('系统消息','用户'+data.user+'上线了',format_time(data.time),'system');
    } else {
      var sys = build_chat('系统消息','你进入了聊天室',format_time(data.time),'system');
    }
    $("#js_contents").append(sys + "<br/>");
    //flush the content
    flushContentScroll();
    //fulsh user list
    flushUsers(data.users);
  });

  socket.on('say', function (data) {
    //say to all talker
    if (data.to == 'all') {
      $("#js_contents").append(build_chat(data.from,data.msg,format_time(data.time),'public'));
    }
    //flush the scroll , make it clover
    flushContentScroll();
  });

  socket.on('offline', function (data) {
    //broadcast offline 
    var sys = build_chat('系统消息',data.user+'下线了',format_time(data.time),'system');
    $("#js_contents").append(sys + "<br/>");
    flushUsers(data.users);
    if (data.user == to) {
      to = "all";
    }
    //flush all content
    flushContentScroll();
  });

  //shutdown the server
  socket.on('disconnect', function() {
    var sys = build_chat('系统消息','系统:连接服务器失败！',format_time(data.time),'system');
    $("#js_contents").append(sys + "<br/>");
    $("#list").empty();
    flushContentScroll();
  });

  //restart server
  socket.on('reconnect', function() {
    var sys = build_chat('系统消息','系统:重新连接服务器！',format_time(data.time),'system');
    $("#js_contents").append(sys + "<br/>");
    flushContentScroll();
    socket.emit('online', {user: from});
  });

  //flush user 
  function flushUsers(users) {
    var num = 0;
    $("#js_list").empty();
    for (var i in users) {
      $("#js_list").append('<li><a href="#"><span class="lsit_font_avator">'+users[i].charAt(0)+'</span>'+users[i]+'</a></li>');
      num++;
    }
    $("#js_list_head").empty().append('联系人列表('+num+')');
  }

  //format time for view
  function format_time(server_time) {
    var date = new Date(server_time);
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    return time;
  }

  //send message to others
  function send_msg(){
    var $msg = $("#js_input_content").val();
    if ($msg == "") return;
    if (to == "all") {
      $("#js_contents").append(build_chat('我对所有人 说：',$msg,format_time(new Date()),'self'));
    } else {
      $("#js_contents").append(build_chat('我对所'+to+' 说：',$msg,format_time(new Date()),'self'));
    }
    flushContentScroll();
    socket.emit('say', {from: from, to: to, msg: $msg});
    $("#js_input_content").val("").focus();
  }

  //listen the enter keydown
  $("#js_input_content").keydown(function(e){
    if (e.keyCode == 13) {
      send_msg();
    }
  });
  
  //send message
  $("#js_say").click(function() {
    send_msg();
  });
});
