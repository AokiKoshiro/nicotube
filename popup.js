var display_time_input = document.getElementById('display_time_input');
var display_time_output = document.getElementById('display_time_output');
var early_display_input = document.getElementById('early_display_input');
var early_display_output = document.getElementById('early_display_output');
var comment_opacity_input = document.getElementById('comment_opacity_input');
var comment_opacity_output = document.getElementById('comment_opacity_output');
var max_comments_input = document.getElementById('max_comments_input');
var max_comments_output = document.getElementById('max_comments_output');
var max_length_input = document.getElementById('max_length_input');
var max_length_output = document.getElementById('max_length_output');
var api_key_input = document.getElementById('api_key_input');
var btn = document.getElementById('btn');

chrome.storage.sync.get(['api_key', 'max_comments', 'max_length', 'display_time', 'early_display', 'comment_opacity'], (items) => {
    if (items.api_key) {
        api_key_input.value = items.api_key;
    } else {
        alert('APIキーを入力してください。');
    }
    max_comments_input.value = items.max_comments;
    max_length_input.value = items.max_length;
    display_time_input.value = items.display_time;
    early_display_input.value = items.early_display;
    comment_opacity_input.value = items.comment_opacity;
    max_comments_output.innerHTML = items.max_comments * 100 || 1000;
    max_length_output.innerHTML = items.max_length || 100;
    display_time_output.innerHTML = items.display_time || 7;
    early_display_output.innerHTML = items.early_display || 1.5;
    comment_opacity_output.innerHTML = items.comment_opacity || 0.8;
});

display_time_input.addEventListener('input', () => {
    display_time_output.innerHTML = display_time_input.value;
});

early_display_input.addEventListener('input', () => {
    early_display_output.innerHTML = early_display_input.value;
});

comment_opacity_input.addEventListener('input', () => {
    comment_opacity_output.innerHTML = comment_opacity_input.value;
});

max_comments_input.addEventListener('input', () => {
    max_comments_output.innerHTML = max_comments_input.value * 100;
});

max_length_input.addEventListener('input', () => {
    max_length_output.innerHTML = max_length_input.value;
});

btn.addEventListener('click', () => {
    var message = {
        'api_key': api_key_input.value,
        'max_comments': max_comments_input.value,
        'max_length': max_length_input.value,
        'display_time': display_time_input.value,
        'early_display': early_display_input.value,
        'comment_opacity': comment_opacity_input.value
    }

    chrome.storage.sync.set(message);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });

    window.close();
});
