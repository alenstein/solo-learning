window.material = window.material || {};
window.material.easings = {
    swiftIn: [0.4, 0, 0.2, 1],
    swiftOut: [0.8, 0, 0.6, 1]
}

$(function () {
    var $wave = null;
    $(document.body).on('mousedown', '.materialButton, .materialIcon, .actionButton, .materialResponse', function (e) {
        var $item = $(this);
        var wave = $item.data('materialWave');
        if (wave == null) {
            var radius = Math.sqrt(Math.pow($item.outerWidth(), 2) + Math.pow($item.outerHeight(), 2)) || 80;
            wave = {
                $elem: $('<i class="materialWave" style="width:' + (radius * 2) + 'px;height:' + (radius * 2) + 'px;"></i>'),
                radius: radius
            }
            $item.append(wave.$elem);
            $item.data('materialWave', wave);
        }
        $wave = wave.$elem;
        var offset = $item.offset();
        $wave.velocity('stop');
        $wave.css({
            left: e.pageX - offset.left - wave.radius + 'px',
            top: e.pageY - offset.top - wave.radius + 'px',
            opacity: 1
        })
        $wave.velocity({
            scaleX: [1, 0],
            scaleY: [1, 0]
        }, {
            easing: material.easings.swiftIn,
            duration: 700
        });
    }).mouseup(function () {
        if($wave != null){
            $wave.velocity({
                opacity: 0
            }, {
                easing: material.easings.swiftOut,
                delay: 100,
                duration: 500,
                queue: false
            });
        }
    });
});