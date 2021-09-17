(function () {
    var hostname = 'sololearn.com/';

    function getFid() {
        return document.cookie.replace(/(?:(?:^|.*;\s*)fngprntId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    }

    function generateFid(cb) {
        fngprnt.get(function (cs) {
            var values = [];
            for (let i = 0; i < cs.length; i++) {
                values.push(cs[i].value);
            }
            cb(fngprnt.x64hash128(values.join(''), 31));
        });
    }

    function setCookie(hash) {
        var date = new Date();
        date.setTime(date.getTime() + (3 * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
        document.cookie = 'fngprntId=' + hash + expires;
    }

    function dispatchEvent(hash) {
        document.dispatchEvent(new CustomEvent("fngprntDefined", { detail: hash }));
    }

    function isHostReferrer(hostname) {
        return document.referrer.indexOf(hostname) > -1;
    }

    function hasVisitedBefore() {
        return !!sessionStorage.getItem('sessionStart');
    }

    function setSessionStart() {
        sessionStorage.setItem('sessionStart', new Date().getTime().toString());
    }

    function isNewVisit() {
        return !(isHostReferrer(hostname) || hasVisitedBefore());
    }

    function getUserId() {
        var user = JSON.parse(localStorage.getItem('user'));
        return user ? user.data.id : null;
    }

    function sendPageVisitEvent(fid) {
        var userId = null;
        if (getUserId() !== null) {
            userId = getUserId().toString();
        }
        var visitBody = {
            experiment: '',
            subject: fid.toString(),
            action: 'visit',
            page: window.location.href,
            element: '',
            referrer: document.referrer,
            userId: userId,
        };
        var xhr = new XMLHttpRequest();
        xhr.open("POST", window.slConfig.envURLs.trackingApiHost + '/api/event', true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(visitBody));
    }

    if (isNewVisit()) {
        setSessionStart();
        var fid = getFid();
        if (!fid) {
            generateFid(function (hash) {
                setCookie(hash);
                sendPageVisitEvent(hash);
                dispatchEvent(hash);
            });
        } else {
            sendPageVisitEvent(fid);
            dispatchEvent(fid);
        }
    } else if (!getFid()) {
        generateFid(function (hash) {
            setCookie(hash);
            dispatchEvent(hash);
        });
    } else {
        dispatchEvent(getFid());
    }
})();
