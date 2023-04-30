var video_id = (window.location.search.split('v=')[1] || '').split('&')[0];
var url_base = 'https://www.googleapis.com/youtube/v3/commentThreads?&maxResults=100&order=relevance&part=snippet&videoId=' + video_id;
var page_token = '';
var comment_list = [];
var api_key;
var max_comments;
var max_length;
var display_time;
var early_display;
var comment_opacity;
var btn_on_off;
var time_list = [];

var $nico_comments_outer = $('#nico-comments-outer');
var $ytp_left_controls;
var $comment_btn_input = $('#comment-btn-input');
var $time_marker_list = $('#time-marker-list');
var $video;
var $ytd_player;
var $nico_commen_wrap = $('.nico-comment-wrap');

chrome.storage.sync.get([
    'api_key',
    'max_comments',
    'max_length',
    'display_time',
    'early_display',
    'comment_opacity'
], (items) => {
    if (items.api_key) {
        api_key = items.api_key;
        url_base += '&key=' + api_key;
    } else {
        alert('APIキーを入力してください。');
    }
    max_comments = items.max_comments || 10;
    max_length = items.max_length || 100;
    display_time = items.display_time || 7;
    early_display = items.early_display || 1.5;
    comment_opacity = items.comment_opacity || 0.8;
});
chrome.runtime.onMessage.addListener((request) => {
    chrome.storage.sync.set(
        {
            'api_key': request.api_key,
            'max_comments': request.max_comments,
            'max_length': request.max_length,
            'display_time': request.display_time,
            'early_display': request.early_display,
            'comment_opacity': request.comment_opacity
        }
    );
    if (api_key !== request.api_key || max_comments !== request.max_comments || max_length !== request.max_length) {
        document.location.reload();
    } else {
        display_time = request.display_time;
        early_display = request.early_display;
        comment_opacity = request.comment_opacity;
        $nico_comments_outer.get(0).style.opacity = comment_opacity;
    }
});

window.addEventListener('yt-navigate-start', () => {
    document.location.reload();
    set_comment_btn();
});

if (document.body) set_comment_btn();
else document.addEventListener('DOMContentLoaded', set_comment_btn);

function set_comment_btn() {
    $ytp_left_controls = $('.ytp-left-controls');
    $ytp_left_controls.append(`
    <div id="comment-btn-outer">
        <input type="checkbox" id="comment-btn-input"/>
        <label for="comment-btn-input">
            <svg id="comment-btn-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.8 18H3.6c-.9 0-1.6-.7-1.6-1.6V3.6C2 2.7 2.7 2 3.6 2h16.8c.9 0 1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6h-7.9l-4.2 3.8a1 1 0 01-1 .1.8.8 0 01-.5-.7V18z"></path>
            </svg>
        </label>
        <div id="comment-btn-bar"></div>
    </div>
    `);
    $comment_btn_input = $('#comment-btn-input');
    btn_on_off_fn();
}

function btn_on_off_fn() {
    $video = $('video');

    chrome.storage.sync.get(['btn_on_off'], (item) => {
        if (item.btn_on_off == 'on') {
            btn_on_off = 'on'
            $comment_btn_input.prop('checked', true);
            main();
        } else {
            btn_on_off = 'off'
            $comment_btn_input.prop('checked', false);
        }
    });

    $comment_btn_input.on('click', () => {
        if ($comment_btn_input.prop('checked')) {    //クリックし終わった音のcomment-btn-inputのオン・オフを判定
            btn_on_off = 'on';
            chrome.storage.sync.set({ "btn_on_off": 'on' });
            if (comment_list.length == 0) {
                main();
            } else {
                $time_marker_list.get(0).style.display = 'inline-block';
                after_get_comment_list();
            }
        } else {
            btn_on_off = 'off'
            chrome.storage.sync.set({ 'btn_on_off': "off" });
            $nico_comments_outer.remove();
            $time_marker_list.get(0).style.display = 'none';
            $video.off('timeupdate')
        }
    });
}

async function main() {
    if (video_id) {
        $nico_comments_outer.remove();
        $time_marker_list.remove();

        await get_comment_list();
        if (btn_on_off == 'on') {
            after_get_comment_list();
        }
    }
}

function after_get_comment_list() {
    generate_nico_comments();
    generate_time_marker();
    move_next_time_marker();
}

async function get_comments(url) {
    var res = await fetch(url);
    var data = await res.json();
    for (var item of data.items) {
        var comment = item.snippet.topLevelComment.snippet.textOriginal;
        if (comment.length < max_length) {
            const timestamp_pattern = /((\d?\d):)?((\d?\d):)(\d\d)/;
            var time = comment.match(timestamp_pattern);
            if (time !== null) {
                var seconds = (Number(time[2]) || 0) * 60 * 60 + Number(time[4]) * 60 + Number(time[5]);
                var comment_info = [seconds, comment];
                comment_list.push(comment_info);
            }
        }
    }
    page_token = data.nextPageToken;
}

async function get_comment_list() {
    for (var i = 0; i < max_comments; i++) {
        url = url_base + '&pageToken=' + page_token;
        try {
            await get_comments(url);
        } catch { break; }
    }
}

function generate_nico_comments() {
    $ytd_player = $('#ytd-player');
    $ytd_player.append('<div id="nico-comments-outer"></div>');
    $nico_comments_outer = $('#nico-comments-outer');
    $nico_comments_outer.get(0).style.opacity = comment_opacity;
    var time_floor;
    var player_width;
    $video.on('timeupdate', () => {
        var time = $video.get(0).currentTime + Number(early_display);
        if (Math.floor(time) !== time_floor) {
            time_floor = Math.floor(time);
            player_width = $ytd_player.width();
            for (var comment_info of comment_list) {
                if (comment_info[0] == time_floor || (comment_info[0] <= time_floor && time_floor < early_display)) {
                    display_comments(comment_info);
                }
            }

            for (var comment of $nico_commen_wrap) {
                if (comment.style.display == 'none') {
                    comment.remove();
                }
            }
        } else {
            time_floor = Math.floor(time);
        }
    });

    $video[0].addEventListener('pause', () => {
        if (!$video.get(0).ended) {
            TweenMax.pauseAll();
        }
    });
    $video[0].addEventListener('play', () => {
        TweenMax.resumeAll();
    });
    $video[0].addEventListener('seeking', () => {
        TweenMax.killAll();
        $nico_commen_wrap.remove();

        var time = $video.get(0).currentTime + Number(early_display);
        time_floor = Math.floor(time);
        player_width = $ytd_player.width();
        for (var comment_info of comment_list) {
            if (time_floor - Number(early_display) <= comment_info[0] && comment_info[0] <= time_floor) {
                display_comments(comment_info);
            }
        }
    });

    var display_comments = (comment_info) => {
        var time_class = `time-${comment_info[0]}`;
        var comment_class = `nico-comment-${comment_list.indexOf(comment_info)}`;
        $nico_comments_outer.append(`
        <div class='nico-comment-wrap ${time_class} ${comment_class}'>
            <div class='nico-comment'>${comment_info[1]}</div>
        </div>
        `);
        $nico_commen_wrap = $('.nico-comment-wrap');

        var comment_element = document.getElementsByClassName(comment_class)[0].children[0];
        var comment_width = comment_element.scrollWidth;

        TweenMax.to(comment_element, display_time, {
            right: player_width + comment_width,
            ease: Power0.easeNone,
            onComplete: () => {
                $(`.${time_class}`).slideUp(250);
            }
        });
    };

    change_nico_comment_size();
}

function change_nico_comment_size() {
    var set_size = () => {
        if (document.fullscreenElement) {
            $nico_comments_outer.get(0).style.fontSize = '35px';
        } else {
            $nico_comments_outer.get(0).style.fontSize = '25px';
        }
    };

    set_size();
    document.addEventListener('fullscreenchange', set_size);
}

function generate_time_marker() {
    time_list = comment_list.map(item => item[0]);
    time_list = Array.from(new Set(time_list));
    $('.ytp-timed-markers-container').append("<div id='time-marker-list'></div>");
    $time_marker_list = $('#time-marker-list');
    var duration = $video.get(0).duration;
    for (var time of time_list) {
        var time_class = 'time-marker-' + time;
        var time_position = time / duration * 100;
        $time_marker_list.append(`<div class='time-marker ${time_class}'></div>`);
        $('.' + time_class).get(0).style.left = time_position + '%';
    }
}

function move_next_time_marker() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            if (e.key == 'ArrowRight') {
                var sorted_time_list = time_list.sort((a, b) => a - b);
                var current_time = $video.get(0).currentTime;
                for (var time of sorted_time_list) {
                    if (time - early_display > current_time) {
                        $video.get(0).currentTime = time - early_display;
                        break;
                    }
                }
            }
            if (e.key == 'ArrowLeft') {
                var reversed_time_list = time_list.sort((a, b) => b - a);
                var current_time = $video.get(0).currentTime;
                for (var time of reversed_time_list) {
                    if (time < current_time) {
                        $video.get(0).currentTime = time - early_display;
                        break;
                    }
                }
            }
        }
    });
}
