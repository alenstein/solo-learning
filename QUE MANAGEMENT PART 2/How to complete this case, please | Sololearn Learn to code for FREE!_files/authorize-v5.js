//(function () {
//    function hasOwin() {
//        return document.cookie.indexOf('LoginState=1') > -1;
//    }

//    function hasTokens() {
//        var user = JSON.parse(localStorage.getItem('user'));
//        var accessToken = JSON.parse(localStorage.getItem('accessToken'));
//        return !!(user && user.data && accessToken && accessToken.data);
//    }

//    if (
//        (hasOwin() && !hasTokens()) || (hasTokens() && !hasOwin())
//    ) {
//        localStorage.removeItem('user');
//        localStorage.removeItem('accessToken');
//        localStorage.removeItem('refreshToken');
//        localStorage.removeItem('isDark');
//        localStorage.removeItem('expiresIn');
//        localStorage.removeItem('msAccessToken');
//        localStorage.removeItem('serviceAccessToken');
//        window.location.href = "/User/Logout?returnUrl=" + window.location.pathname;
//    }
//})();

