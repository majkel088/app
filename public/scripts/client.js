var socket = io(),
    app = {};

socket.on('msg', function (msg) {
    app.recieve_message(msg);
});


app.salt = "961531a469ae307ecba504d9218fc3dbfd78a104c602b47654fc67dd285895c9cecd040e6c61c7ca1092e7df6bc45431bc62c1c9562b32517916f4302f2d9133fd7400f18404f3e41772a0e58c1bd052d0dfe7359ac711271026786f961b35100ed9358dc620a57d91da84d78c92911f7adc6841f066b0a7433c9607f382263b",
app.key = undefined;
app.user = prompt("Podaj nazwe użytkownika");
app.room = prompt("Podaj pokój");
app.pass = prompt("Podaj hasło do pokoju");

var jsonFormatter = {
    stringify: function (cipherParams) {
        // create json object with ciphertext
        var jsonObj = {
            ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
        };

        // optionally add iv and salt
        if (cipherParams.iv) {
            jsonObj.iv = cipherParams.iv.toString();
        }

        // stringify json object
        return JSON.stringify(jsonObj);
    },

    parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);

        // extract ciphertext from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });

        // optionally extract iv and salt
        if (jsonObj.iv) {
            cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
        }

        return cipherParams;
    }
};

//funkcja dołaczania do pokoju
app.join = function () {
    app.key = CryptoJS.PBKDF2(app.pass, app.salt, { keySize: 256 / 32, iterations: 1000 })
    socket.emit('join-room', {
        name: app.user,
        room: app.room,
        msg: app.user + " dołączył do pokoju"
    });

    app.welcome("Serwer", "Dołaczyłeś jako ", app.user, " do pokoju ", app.room);
    socket.emit('history');
};

//lista użytkowników połaczonych w aktualnym pokoju
var userList = [];
socket.on('update', function(users){
    userList = users;
    $('#users').empty();
    for(var i=0; i<userList.length; i++) {
        $('#users').append('<li class="list-group-item">' + userList[i] + "</li>"); 
    }
})

//funkcja wysyłania wiadomośći
app.send_message = function (msg) {
    var encrypted = CryptoJS.RC4.encrypt(msg, app.key);
    var string = jsonFormatter.stringify(encrypted);
    socket.emit('msg', {
        name: app.user,
        room: app.room,
        msg: string
    });
}

//funkcja otrzymywania wiadomości
app.recieve_message = function (msg) {
    var plain = undefined;
    if (msg.name !== "Serwer") {
        var encrypted = jsonFormatter.parse(msg.msg);
        var decrypted = CryptoJS.RC4.decrypt(encrypted, app.key);
        plain = decrypted.toString(CryptoJS.enc.Utf8);
    } else {
        plain = msg.msg;
    }
    app.add_line(msg.name, plain);
}

app.on_input = function () {
    var msg = $("#txt").val();
    if (!msg && typeof msg !== "string") return;

    app.send_message(msg);
    $("#txt").val('');
}

app.add_line = function (user, line) {
    $("#messages").append('<li><span class="name">' + user + '&nbsp;|&nbsp;</span><span>' + line.replace(/<(?:.|\n)*?>/gm, '') + '</span></li>');
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
}

app.welcome = function (user, line, user2, line2, room) {
    $("#messages").append('<li><span class="name">' + user + '&nbsp;|&nbsp;</span><span>' + line.replace(/<(?:.|\n)*?>/gm, '') + '</span><span class="name2">' + user2 + '</span><span>' + line2.replace(/<(?:.|\n)*?>/gm, '') + '</span><span class="name2">' + room + '</li>');
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
}


app.start_up = function () {
    app.add_line("Serwer", "Witaj!!");
}


$("#txt").keypress(function (e) {
    if (e.which == 13) {
        app.on_input();
    }
});

$("#txt").keydown(function (e) {
    if (e.which == 38) {
        app.on_command_search(true);
    } else if (e.which == 40) {
        app.on_command_search(false);
    }
})

$("#send").click(function () {
    app.on_input();
});

app.start_up();
app.join();