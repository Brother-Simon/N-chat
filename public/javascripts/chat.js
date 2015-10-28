$(document).ready(function() {
  $(window).keydown(function (e) {
    if (e.keyCode == 116) {
      if (!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
        e.preventDefault();
      }
    }
  });
  function flush_content_scroll(){
    $("#js_chat_content").scrollTop($("#js_contents").height());
  }
  //构建聊天dom
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
  //添加自己说的dom
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
  var from = $.cookie('user');//从 cookie 中读取用户名，存于变量 from
  var to = 'all';//设置默认接收对象为"所有人"
  //发送用户上线信号
  socket.emit('online', {user: from});
  socket.on('online', function (data) {
    //显示系统消息
    if (data.user != from) {
      // var sys = '<div style="color:#f00">系统(' + now() + '):' + '用户 ' + data.user + ' 上线了！</div>';
      var sys = build_chat('系统消息','用户'+data.user+'上线了',format_time(data.time),'system');
    } else {
      // var sys = '<div style="color:#f00">系统(' + now() + '):你进入了聊天室！</div>';
      var sys = build_chat('系统消息','你进入了聊天室',format_time(data.time),'system');
    }
    $("#js_contents").append(sys + "<br/>");
    flush_content_scroll();
    //刷新用户在线列表
    flushUsers(data.users);
    //显示正在对谁说话
    showSayTo();
  });

  socket.on('say', function (data) {
    //对所有人说
    if (data.to == 'all') {
      $("#js_contents").append(build_chat(data.from,data.msg,format_time(data.time),'public'));
    }
    //对你密语
    if (data.to == from) {
      $("#js_contents").append(build_chat(data.from+'<<对你密语>>',data.msg,format_time(data.time),'private'));
    }
    flush_content_scroll();
  });

  socket.on('offline', function (data) {
    //显示系统消息
    var sys = build_chat('系统消息',data.user+'下线了',format_time(data.time),'system');

    $("#js_contents").append(sys + "<br/>");
    //刷新用户在线列表
    flushUsers(data.users);
    //如果正对某人聊天，该人却下线了
    if (data.user == to) {
      to = "all";
    }
    //显示正在对谁说话
    showSayTo();
    flush_content_scroll();
  });

  //服务器关闭
  socket.on('disconnect', function() {
    var sys = build_chat('系统消息','系统:连接服务器失败！',format_time(data.time),'system');
    $("#js_contents").append(sys + "<br/>");
    $("#list").empty();
    flush_content_scroll();
  });

  //重新启动服务器
  socket.on('reconnect', function() {
    var sys = build_chat('系统消息','系统:重新连接服务器！',format_time(data.time),'system');
    $("#js_contents").append(sys + "<br/>");
    flush_content_scroll();
    socket.emit('online', {user: from});
  });

  //刷新用户在线列表
  function flushUsers(users) {
    var num = 0;
    //遍历生成用户在线列表
    $("#js_list").empty();
    for (var i in users) {
      $("#js_list").append('<li><a href="#"><span class="lsit_font_avator">'+users[i].charAt(0)+'</span>'+users[i]+'</a></li>');
      num++;
    }
    $("#js_list_head").empty().append('联系人列表('+num+')');
    //双击对某人聊天
    $("#list > li").dblclick(function() {
      //暂未实现
      return false;
      //如果不是双击的自己的名字
      if ($(this).attr('alt') != from) {
        //设置被双击的用户为说话对象
        to = $(this).attr('alt');
        //清除之前的选中效果
        $("#list > li").removeClass('sayingto');
        //给被双击的用户添加选中效果
        $(this).addClass('sayingto');
        //刷新正在对谁说话
        showSayTo();
      }
    });
  }

  //显示正在对谁说话
  function showSayTo() {
    $("#from").html(from);
    $("#to").html(to == "all" ? "所有人" : to);
  }

  //获取当前时间
  function format_time(server_time) {
    var date = new Date(server_time);
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    return time;
  }
  function send_msg(){
    //获取要发送的信息
    var $msg = $("#js_input_content").val();
    if ($msg == "") return;
    //把发送的信息先添加到自己的浏览器 DOM 中
    if (to == "all") {
      $("#js_contents").append(build_chat('我对所有人 说：',$msg,format_time(new Date()),'self'));
    } else {
      $("#js_contents").append(build_chat('我对所'+to+' 说：',$msg,format_time(new Date()),'self'));
    }
    flush_content_scroll();
    //发送发话信息
    socket.emit('say', {from: from, to: to, msg: $msg});
    //清空输入框并获得焦点
    $("#js_input_content").val("").focus();
  }
  //监听发话回车时间
  $("#js_input_content").keydown(function(e){
    if (e.keyCode == 13) {
      send_msg();
    }
  });
  //发话
  $("#js_say").click(function() {
    send_msg();
  });
});
