var ms_sux = false;
var disable_ext = false;
var killed = 0;
var missed = 0;
var total = 3;
var total_shoots = 0;
var timeleft = 120;
var reloaded = true;
var lets_start = false;
var rrr = 7;
function get_version(s) {
    result = "";
    for (i = 0; i != s.length; i++)
        if (s.charAt(i) >= "0" && s.charAt(i) <= "9") result += s.charAt(i);
        else break;
    return result;
}

if (
    navigator.appName == "Microsoft Internet Explorer" &&
    get_version(navigator.appVersion) < 4
) {
    disable_ext = true;
    ms_sux = true;
}

if (navigator.appName == "Netscape" && get_version(navigator.appVersion) < 3) {
    disable_ext = true;
}

function rndm(n) {
    dt = new Date();
    rrr = (Math.round(dt.getTime() / 10) + rrr) % n;
    return rrr;
}

function shotgun_array() {
    for (n = 0; n != 10; n++) {
        this[n] = new Image(200, 130);
        this[n].src = "shotgun0" + n + ".jpg";
    }
    return;
}
if (!disable_ext) var shotgun = new shotgun_array();

function leo_array() {
    for (n = 0; n != 18; n++) {
        this[n] = new Image(100, 75);
        this[n].src = "l" + n + ".jpg";
    }
    return;
}
if (!disable_ext) var leo = new leo_array();

function leos_stat() {
    this.x = rndm(5);
    this.y = rndm(3);
    this.direction = 1;
    this.pos = rndm(6);
    this.togo = rndm(20);
}

function leos_n(n) {
    for (m = 0; m != n; m++) this[m] = new leos_stat();
}
var leocount = 3;
var leos = new leos_n(leocount);

function exist(x, y, l) {
    for (n = 0; n != leocount; n++) if (l[n].x == x && l[n].y == y) return true;
    return false;
}

function main_stream() {
    for (m = 0; m != leocount; m++) {
        with (leos[m]) {
            if (direction == 0) {
                pos++;
                if (pos >= 18) {
                    direction = -1;
                    pos = 1;
                }
            } else {
                if (pos == 0 && direction == -1) {
                    direction = 1;
                    xx = rndm(5);
                    yy = rndm(3);
                    while (exist(xx, yy, leos) == true) {
                        xx = rndm(5);
                        yy = rndm(3);
                    }
                    x = xx;
                    y = yy;
                    total++;
                    togo = rndm(20);
                }
                if (pos == 8 && direction == 1) {
                    direction = -1;
                    togo = 5 + rndm(10);
                }
                if (togo == 0) pos += direction;
                else togo--;
            }
            document.images["pos" + y + x].src = leo[pos].src;
        }
    }
    setTimeout("main_stream()", 50);
    return;
}

var nc = 0;
function shoot_em() {
    if (nc == 10) {
        document.drobovik.src = shotgun[0].src;
        nc = 0;
        reloaded = true;
        return;
    }
    document.drobovik.src = shotgun[nc++].src;
    setTimeout("shoot_em()", 150);
    return;
}

function kill_em(s) {
    if (!lets_start) return;
    if (!reloaded) return;
    shoot_em();
    reloaded = false;
    for (n = 0; n != leocount; n++) {
        if (s == "pos" + leos[n].y + leos[n].x && leos[n].pos > 2) {
            leos[n].direction = 0;
            total_shoots++;
            killed++;
            document.statistic.bodycount.value++;
            return;
        }
    }
    total_shoots++;
    missed++;
    document.statistic.misses.value++;
    return;
}

function set_time_left() {
    document.statistic.timeleft.value =
        Math.floor(timeleft / 60) +
        ":" +
        Math.floor((timeleft % 60) / 10) +
        (timeleft % 10);
    if (--timeleft < 0) {
        document.writeln(
            '<html><head><title>Results</title></head><body bgcolor="white" text="black"><center><h1>Game Over</h1><p>Enemies killed: <b>' +
                killed +
                "</b><br>Enemies missed: <b>" +
                missed +
                "</b><br>Accuracy: <b> " +
                Math.round((100 * killed) / (killed + missed + 0.01)) +
                "</b>%<br>Committed suicide(drowned): <b>" +
                (total - missed) +
                "</b><br></p></center>"
        );
        document.write("</body></html>");
        document.close();
        return;
    }
    setTimeout("set_time_left()", 1000);
}

function loading_sequence() {
    /*      for(n=0;n!=18;n++)
                 if(leo[n].complete!=true){
                         document.statistic.bodycount.value="Loading "+Math.round(100.0*n/28.0)+"%";
                         setTimeout("loading_sequence()",500);
                         return;
                 }
         for(n=18;n!=28;n++)
                 if(shotgun[n-18].complete!=true){
                                         document.statistic.bodycount.value="Loading "+Math.round(100.0*n/28.0);
                         setTimeout("loading_sequence()",500);
                         return;
                 } */
    document.statistic.bodycount.value = "0";
    lets_start = true;
    main_stream();
    set_time_left();
}

if (!disable_ext)
    with (document) {
        writeln(
            "<div align=center><a name='v666'>Ver 0.666 alpha: T2 (titanic II) ... Just click on a head and enjoy:)</a>"
        );
        writeln("<table border=0 cellpadding=0 cellspacing=0>");
        for (y = 0; y != 3; y++) {
            write("<tr>");
            for (x = 0; x != 5; x++)
                write(
                    '<td><a href=#v666  onClick=kill_em("pos' +
                        y +
                        x +
                        '")><img src="l0.jpg" name="pos' +
                        y +
                        x +
                        '" border=0></a></td>'
                );
            write("</tr>");
        }

        writeln("</table>");
        writeln('<table border=0 cellpadding="0" cellspacing="0">');
        writeln("<tr><td width=100>&nbsp;</td>");
        writeln(
            '<td><img src="shotgun00.jpg" width=200 height=130 border=0 name="drobovik"></td>'
        );
        writeln("<td width=200 valign=top>");
        writeln('<form name="statistic">');
        writeln("<table>");
        writeln("<tr><td><b>Body Count</b></td>");
        writeln(
            '<td><input type="text" readonly size="14" name="bodycount" value="0"></td>'
        );
        writeln("</tr><tr><td><b>Misses</b></td>");
        writeln(
            '<td><input type="text" readonly name="misses" size="14" value="0"></td>'
        );
        writeln("</tr><tr><td><b>Time left</b></td>");
        writeln(
            '<td><input type="text" readonly name="timeleft" size=7 value=""</td></tr>'
        );
        writeln("</table></form>");
        writeln("</td></tr></table></div>");
    }
else {
    if (ms_sux) {
        document.write(
            "<center><hr><h1>Error!</h1><p aling=left></p></center>Urgh! <b>Microsoft Internet Explorer found!</b>Why do you still use this f#cking piece of shit? This stupid browser don't support some extra features (even JavaScript), needed for this game! This site best viewed with <a href='http://www.netscape.com'>Netscape</a> 3.0 or any later version of this really cool browser! And remember Micros0ft is <b>evil and will be destroyed</b>!</p><center><p><a href='http://www.netscape.com/donwload'>Download Netscape now!</a></p><hr></center>"
        );
    } else
        document.write(
            "<center><h1 align=center>Error!</h1><p aling=left>We're sorry, but your browser don't support some extra features, needed for this page! This site best viewed with Netscape 3.0 or any later version of this really cool browser! And remember Micros0ft - <b>SUX</b>!</p><center><a href='http://www.netscape.com/donwload'>Download Netscape now!</a></center>"
        );
}

if (!disable_ext) setTimeout("loading_sequence()", 1000);
