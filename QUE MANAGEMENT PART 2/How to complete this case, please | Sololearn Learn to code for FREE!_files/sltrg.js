var sltrg = {
    getQueue: function () {
        return JSON.parse(sessionStorage.getItem('trackingQueue')) || [];
    },
    addEventToQueue: function (event) {
        var queue = sltrg.getQueue();
        queue.push({ id: sltrg.createId(), event });
        sessionStorage.setItem('trackingQueue', JSON.stringify(queue));
    },
    sendEvent: function (event, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", window.slConfig.envURLs.trackingApiHost + '/api/event', true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = onload;
        xhr.onerror = onerror;
        xhr.send(JSON.stringify(event));
    },
    removeFromQueue: function (id) {
        var queue = sltrg.getQueue();
        var index;
        for (var i = 0; i < queue.length; i++) {
            if (queue[i].id === id) {
                index = i;
                break;
            }
        };
        queue.splice(index, 1);
        sessionStorage.setItem('trackingQueue', JSON.stringify(queue));
    },
    createId: function () {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
}

function getUserId() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        return user.data.id;
    }
    return null;
}

function slTrack(eventData) {
    var event = {
        experiment: eventData.experiment || '',
        action: eventData.action,
        element: eventData.element,
        page: window.location.href,
        referrer: document.referrer,
        subject: document.cookie.replace(/(?:(?:^|.*;\s*)fngprntId\s*\=\s*([^;]*).*$)|^.*$/, "$1"),
        userId: eventData.userId || getUserId(),
        entityId: (typeof eventData.entityId === "number" || typeof eventData.entityId === "string") ? eventData.entityId : null
    }
    if (eventData.redirectUrl) {
        sltrg.addEventToQueue(event);
        window.location.href = eventData.redirectUrl;
    } else {
        sltrg.addEventToQueue(event);
        clearTrackingQueue();
    }
}

function clearTrackingQueue() {
    var queue = sltrg.getQueue();
    if (!queue.length) {
        return;
    } else {
        var id = queue[0].id;
        var event = queue[0].event;
        sltrg.sendEvent(event, function() {
            clearTrackingQueue();
        });
        sltrg.removeFromQueue(id);
    }
}

(function () {
    clearTrackingQueue();
})();
