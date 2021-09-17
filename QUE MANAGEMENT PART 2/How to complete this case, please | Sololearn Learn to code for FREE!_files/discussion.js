(function ($) {
    // Constructor
    function FT(elem) {
        this.$textarea = $(elem);
        this._init();
    }
    FT.prototype = {
        _init: function () {
            var _this = this;
            var maxLength = 2048;
            var maxLines = 6;

            // Insert wrapper elem & pre/span for textarea mirroring
            this.$textarea.attr('maxlength', maxLength);
            this.$textarea.wrap('<div class="text-wrap" />');
            this.$textarea.after('<p class="textareaFeed"><span class="count">' + (maxLength - this.$textarea.val().length) + '</span> characters remaining</p>');
            this.$textareaFeed = this.$textarea.next();
            this.$charactersCount = this.$textareaFeed.find('.count');
            // Add input event listeners
            // * input for modern browsers
            // * propertychange for IE 7 & 8
            // * keyup for IE >= 9: catches keyboard-triggered undos/cuts/deletes
            // * change for IE >= 9: catches mouse-triggered undos/cuts/deletions (when textarea loses focus)
            this.$textarea.on('input propertychange keyup change', function () {
                if (_this.$textarea.hasClass('input-validation-error')) {
                    _this.$textarea.removeClass('input-validation-error');
                }
                var textLength = _this.$textarea.val().length;
                var textRemaining = maxLength - textLength;

                _this.$charactersCount.text(textRemaining);
            });

            // jQuery val() strips carriage return chars by default (see http://api.jquery.com/val/)
            // This causes issues in IE7, but a valHook can be used to preserve these chars
            $.valHooks.textarea = {
                get: function (elem) {
                    return elem.value.replace(/\r?\n/g, "\r\n");
                }
            };
            // Mirror contents once on init
        }
    };
    // jQuery plugin wrapper
    $.fn.flexText = function () {
        return this.each(function () {
            // Check if already instantiated on this elem
            if (!$.data(this, 'flexText')) {
                // Instantiate & store elem + string
                $.data(this, 'flexText', new FT(this));
            }
        });
    };
})(jQuery);

$(function () {

    function updateDate($dateTexts) {
        $dateTexts.each(function () {
            var $this = $(this);
            var date = $this.attr('data-date');
            var postDate = moment.utc(date);
            var currentDate = moment.utc(new Date());
            var formattedDate = "";

            var diffWeeks = currentDate.diff(postDate, 'weeks');

            if (diffWeeks > 4) {
                formattedDate = moment(postDate.toDate()).format("Do MMMM YYYY, h:mm A");
            }
            else {
                formattedDate = currentDate.diff(postDate) < 0 ? "a few seconds ago" :moment(moment.utc(postDate.toDate())).fromNow();
            }

            $this.text(formattedDate);
        });
    }

    updateDate($('.date'));

    function updateMessage($messageTexts) {
        var urlRegex = /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+()~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.()~#?&//=]*))/gi;
        //var tagRegex = /(<([^>]+)>)/gi; ///<([a-zA-Z0-9/\-_\s]*)>/g;
        $messageTexts.each(function () {
            var $this = $(this);
            var message = $this.attr('data-value');
            message = message.replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');

            //message = message.replace(tagRegex, function (match1, match2, match3) {
            //    if (match3.indexOf("br") != -1) {
            //        return '<' + match3 + '/>'
            //    }
            //    return '&lt;' + match3 + '&gt;';
            //});

            $this.attr('data-value', message);
            message = message.replace(urlRegex, function (match1, match2) {
                var link = match2;
                var hasHttp = match2.indexOf("http") == 0;

                if (!hasHttp) {
                    var has3w = match2.indexOf("www") == 0;

                    if (!has3w) {
                        return match2;
                    }

                    link = "http://" + match2;    
                }

                return '<a href=' + link + ' target="_blank" class="postLink">' + match2 + '</a>';
            });

            $this.html(message);
        });
    }

    var $searchTags = $('#searchTags');
    var $tabs = $('.questionsFilter .tabs');
    var $searchForm = $('#searchForm');
    var $addQuestion = $('.addQuestion');
    var $editQuestion = $('#editQuestionContainer');
    var $orderingSelect = $('#orderingSelect');

    var selectedValue = "";

    $searchForm.submit(function () {
        var $this = $(this);

        var $ordering = $this.find('#ordering');
        $ordering.val($tabs.find('.tab.active').attr('data-value'));
        selectedValue == "";
    });

    $orderingSelect.on('change', function () {
        var $this = $(this);
        var ordering = $this.val();
        var searchQuery = encodeURIComponent($('#tagsInput').val().trim());
        location = "/Discuss?ordering=" + ordering + "&query=" + searchQuery;
    });

    function split(val) {
        return val.split(" ");
    }

    function extractLast(term) {
        return split(term).pop();
    }

    $('#tagsInput').autocomplete({
        minLength: 3,
        open: function (event, ui) {
            if (navigator.userAgent.match(/iPhone/)) {
                $('.ui-autocomplete').off('menufocus hover mouseover');
            }
        },
        source: function (request, response) {
            $.ajax({
                url: '/Discuss/GetTagSuggestions',
                data: {
                    // delegate back to autocomplete, but extract the last term
                    query: extractLast(request.term)
                },
                dataType: 'json',
                type: 'GET',
                success: function (data) {
                    response($.map(data.suggestions, function (item) {
                        return {
                            label: item,
                            value: item
                        }
                    }));
                },
                error: function (request, status, error) {
                    alert(error);
                }
            })
        },
        focus: function () {
            // prevent value inserted on focus
            return false;
        },
        change: function (event, ui) {
            selectedValue = this.value.trim();

            var url = selectedValue == "" ? "" : "?query=" + selectedValue + "";
            $addQuestion.attr('href', '/Discuss/New/' + url + '');
        },
        select: function (event, ui) {
            var terms = split(this.value);
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push(ui.item.value);
            // add placeholder to get the space at the end
            terms.push("");
            this.value = terms.join(" ");
            return false;
        }
    });

    $('#tagsInput').keypress(function (e) {
        var $this = $(this);
        selectedValue = $this.val();

        if (e.which == 13) {
            $searchForm.submit();
        }
    });

    $('.question').on('click', '.tags .tag', function () {
        var $this = $(this);
        selectedValue = $this.text();
        $("#tagsInput").val(selectedValue);

        $searchForm.submit();
    });

    function toggleClass(value) {
        return value ? 'addClass' : 'removeClass';
    }

    $(document).on('input', '.clearable', function () {
        $('.removeTags')[toggleClass(this.value)]('visible');
    }).on('touchstart click', '.removeTags.visible', function (ev) {
        ev.preventDefault();
        $(this).removeClass('visible');
        $('#tagsInput').val('').change();
        $('#tagsInput').autocomplete('close');
    });

    $('#addQuestion, #editQuestion').on('focus', '#myTags .ui-autocomplete-input', function () {
        var $this = $(this);
        var $parent = $this.closest('.tagInfo');
        $parent.addClass('focus');
    });

    $('#addQuestion, #editQuestion').on('blur', '#myTags .ui-autocomplete-input', function () {
        var $this = $(this);
        var $parent = $this.closest('.tagInfo');
        $parent.removeClass('focus');
        var $tagInput = $("#myTags").find('.ui-autocomplete-input').val();
        if ($tagInput.length > 0) {
            $("#myTags").tagit("createTag", $tagInput);
        }
    });

    $("#myTags").tagit({
        placeholderText: 'Add tag',
        singleField: true,
        singleFieldNode: $('#tagsSingleField'),
        singleFieldDelimiter: ',',
        maxLength: 64,
        tagLimit: 10,
        onTagLimitExceeded: function (event, ui) {
            if ($('.tagit-choice').length >= 10) {
                $('.tagit-new input').val('');
                return false;
            }
        },
        afterTagRemoved: function (event, ui) {
            if ($(this).hasClass('allow')) {
                //DiscussionPostsEditor.load();
            }
        },
        onTagExists: function (event, ui) {
            var $existingTag = $(ui.existingTag[0]);
            $existingTag.addClass('highlight');
            setTimeout(function () {
                $existingTag.removeClass('highlight');
            }, 200);
        },
        autocomplete: ({
            source: function (request, response) {
                $.ajax({
                    url: '/Discuss/GetTagSuggestions',
                    data: {
                        query: request.term
                    },
                    dataType: 'json',
                    type: 'GET',
                    success: function (data) {
                        response($.map(data.suggestions, function (item) {
                            return {
                                label: item,
                                value: item
                            }
                        }));
                    },
                    error: function (request, status, error) {
                        alert(error);
                    }
                })
            },
            minLength: 3
        })
    });

    //Question delete
    $editQuestion.on('click', '.delete', function () {
        var $this = $(this);
        var $editableContainer = $this.parents('#editQuestionContainer');

        ConfirmPopup.open("Are you sure you want to delete this question?", "Yes", "No", function (result) {
            if (result) {
                $.ajax({
                    url: '/Discuss/DeletePost',
                    data: {
                        postId: $editableContainer.attr('data-id')
                    },
                    method: 'post',
                    dateType: 'json',
                    success: function (response) {
                        if (response.success) {
                            window.location = "https://www.sololearn.com/Discuss/";
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        if (xhr.status == 403) {
                            ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                if (result) {
                                    var response = $.parseJSON(xhr.responseText);
                                    window.location = response.logInUrl;
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    var $thread = $('#discussionPost');
    var $postList = $('#replies');
    var $newPostContainer = $('#newPostMessage');
    var $newPostText = $('#newPostMessage .replyText');
    var $answersCount = $('.answersCount .count');
    var $asnwersCountLabel = $('.answersCount .label');


    if ($thread.length > 0) {

        updateMessage($('.message'));

        var ForumLoader = function ($postContainer, $thread) {
            var $window = $(window);
            var self = this;

            var triggerScroll = 0;

            var postId = 0;

            this.invalidate = function () {
                var windowHeight = $window.height();
                var containerHeight = $postContainer.height();
                var containerOffset = $postContainer.offset();

                triggerScroll = containerHeight + containerOffset.top - windowHeight;
                var loadedPosts = $postContainer.children('.post').length;
                $thread.toggleClass('empty', loadedPosts == 0);
                $postList.toggleClass('empty', loadedPosts == 0);
                $thread.toggleClass('long', parseInt($('.answersCount .count').text()) > 20);
                //$thread.toggleClass('short', parseInt($('.answersCount .count').text()) < 20);
                checkScroll();
            };

            this.emptyList = function () {
                $postContainer.empty();
            }

            $window.scroll(checkScroll);

            var isLoading = false;
            var fullyLoaded = false;

            function checkScroll() {
                var scrollTop = window.pageYOffset;

                if (scrollTop >= triggerScroll) {
                    loadNextPage();
                }
            }

            function loadNextPage() {
                if (isLoading || fullyLoaded) return;
                isLoading = true;
                $thread.toggleClass('loading', isLoading);

                var minTime = $.Deferred();
                var response = null;
                var request = $.ajax({
                    url: '/Discuss/GetReplies',
                    data: {
                        postId: postId,
                        index: $postContainer.children().length,
                        questionAuthorId: parseInt($('.question').attr('data-userId')),
                        ordering: $('#repliesOrdering option:selected').val()
                    },
                    method: 'post',
                    dateType: 'json',
                    success: function (json) {
                        response = json;
                    }
                });
                $.when(request, minTime).done(function (v1, v2) {
                    if (response != null) {
                        if (response.html == '') {
                            fullyLoaded = true;
                        }
                        else {
                            var $posts = $(response.html);

                            //updateDate($(response.html).find('.date'));

                            //$posts.css('opacity', 0);
                            //$posts.css('display', 'none');
                            $posts.addClass('hidden');
                            $postContainer.append($posts);
                            window.layout.notifyResize();

                            updateDate($posts.find('.date'));
                            updateMessage($posts.find('.message'));

                            $posts.each(function (i, e) {
                                var delay = Math.min(i * 50, 300) + 'ms';
                                delay += ',' + delay + ',' + delay; + ',' + delay + ',' + delay;
                                $(e).css('-webkit-transition-delay', delay)
                                    .css('transition-delay', delay);
                                //$(e).delay(i * 100).animate({ opacity: 1 }, 400);
                                //$(e).delay(i * 200).slideDown(200);
                            });
                            setTimeout(function () {
                                $posts.removeClass('hidden');
                            }, 100);
                        }
                    }
                    isLoading = false;
                    $thread.toggleClass('loading', isLoading);
                });
                setTimeout(minTime.resolve, 1400);
            }

            postId = parseInt($postContainer.attr('data-id'));

            $window.resize(self.invalidate);
            layout.onResize(self.invalidate);

            this.invalidate();
        };

        if ($postList.length > 0) {
            var $window = $(window);
            var loader = new ForumLoader($postList, $thread);
            var $replyBox = $('#replyBox');
            var $replyText = $('#replyBox .replyText').flexText();
            var $replyButtonText = $('#replyBox').find('.reply span');
            var postId = parseInt($thread.attr('data-id'));

            var isReplyOpen = false;
            var lastReplyTranslate = 0;
            var replyMode = -1;

            function cancelAll() {
                cancelEditPost();
                closeReply();
            }

            var $replyPost = null;

            function openReply(top, left, translate, delay) {
                isReplyOpen = true;
                lastReplyTranslate = translate || 10;
                $replyText.val('').trigger('change');
                $replyBox.velocity('stop').addClass('open');
                $replyBox.removeAttr('style').css({
                    top: top + 'px',
                    marginLeft: (left || 0) + 'px'
                });
                $replyBox.velocity({
                    translateY: [0, lastReplyTranslate],
                    opacity: [1, 0]
                }, { easing: 'ease', delay: (delay || 0) });
                isReplyOpen = true;
            }

            function closeReply(callback) {
                if (!isReplyOpen) return;
                isReplyOpen = false;

                if ($replyText.hasClass('input-validation-error')) {
                    $replyText.removeClass('input-validation-error');
                }

                $replyBox.velocity({
                    translateY: [lastReplyTranslate, 0],
                    opacity: [0, 1]
                }, {
                    easing: 'ease', complete: function () {
                        hideReply();
                        if (typeof callback == 'function') {
                            callback();
                        }
                    }
                });
            }

            function hideReply() {
                isReplyOpen = false;
                $replyBox.removeClass('open');
                $('.question').removeClass('elevated');
                //$postList.children('.elevated').removeClass('elevated');
            }

            function setReplyMode() {
                $replyText.attr('placeholder', 'Write your reply here');
                $replyButtonText.text('Post');
            }

            // Post reply
            $thread.on('click', '.replyControls .reply', function () {
                setReplyMode();
                cancelEditPost();
                $postList.children('.elevated').removeClass('elevated');
                $replyPost = $('.question.post');
                $replyPost.addClass('elevated');

                openReply(
                    $replyPost.offset().top + $replyPost.outerHeight() - $thread.offset().top,
                    parseInt($replyPost.css('marginLeft')) + 8,
                    -100,
                    100
                );
            });

            // Reply submit
            $replyBox.on('click', '.reply', function () {
                var replyOffset = $replyBox.offset();
                var $validationFields = $replyBox.find('.field-validation-error');
                if ($validationFields.length > 0) {
                    $validationFields.remove();
                }

                $replyText.val($replyText.val().trim());
                $replyBox.addClass('loading');

                $.ajax({
                    url: '/Discuss/Reply',
                    data: {
                        parentId: postId,
                        message: $replyText.val(),
                        questionAuthorId: parseInt($('.question').attr('data-userId'))
                    },
                    method: 'post',
                    dateType: 'json',
                    success: function (response) {
                        if (response.success) {
                            hideReply();
                            $replyBox.removeClass('loading');

                            var $html = $(response.html);
                            $html.find('.date').text('a few seconds ago');
                            updateMessage($html.find('.message'));
                            var $firstUnvotedPost = $('#replies').find('.answer.post[data-votes="0"]').first();
                            if ($firstUnvotedPost.length > 0) {
                                $html.insertBefore($firstUnvotedPost);
                            }
                            else {
                                var $firstNegativeVotedPost = $('#replies').find('.post[data-state="negative"]').first();
                                if ($firstNegativeVotedPost.length > 0) {
                                    $html.insertBefore($firstNegativeVotedPost);
                                }
                                else {
                                    var $lastPost = $('#replies').find('.post:not(.question)').last();
                                    if ($lastPost.length > 0) {
                                        $html.insertAfter($lastPost);
                                    }
                                    else {
                                        $postList.append($html);
                                    }
                                }
                            }

                            //updateDate($html.find('.date'));                 

                            window.layout.notifyResize();
                            var $newPost = $postList.children('[data-id=' + response.id + ']');
                            var newOffset = $newPost.offset();
                            $newPost.addClass('new elevated');
                            var translation = newOffset.top - replyOffset.top;
                            var translationDuration = Math.min(200 + Math.abs(translation), 1500);
                            $newPost.velocity({
                                translateY: [0, -translation]
                            }, {
                                easing: material.easings.swiftIn,
                                duration: translationDuration,
                                complete: function () {
                                    $newPost.removeClass('new elevated');
                                }
                            });
                            var windowHeight = $window.height();
                            var postHeight = $newPost.outerHeight();
                            var currentScroll = $window.scrollTop();
                            if (currentScroll < newOffset.top && newOffset.top < currentScroll + windowHeight - postHeight) {
                                // In view
                            } else {
                                var newScroll = Math.min(Math.max(0, newOffset.top - windowHeight + postHeight), $(document.body).outerHeight() - windowHeight);
                                //var scrollSize = newScroll - currentScroll;

                                $("html").velocity("scroll", {
                                    offset: newScroll + 'px',
                                    mobileHA: false,
                                    easing: material.easings.swiftIn,
                                    duration: translationDuration,
                                    //delay: translationDuration * (translation - scrollSize) / translation,
                                    //duration: translationDuration * scrollSize / translation
                                });
                            }

                            var count = parseInt($answersCount.text());
                            $answersCount.text(count + 1);
                            var label = count + 1 == 1 ? " Answer" : " Answers";
                            $asnwersCountLabel.text(label)
                            $newPostContainer.removeClass('noMargin');
                        }
                        else {
                            $replyText = $('#replyBox .replyText');
                            var $textWrap = $replyText.closest('.text-wrap');
                            $textWrap.replaceWith(response.html);
                            $replyText = $('#replyBox .replyText');
                            $replyText.flexText();
                            $replyButtonText = $('#replyBox .replyText').find('.reply span');
                            setReplyMode();
                            cancelEditPost();
                            $replyPost = $('.question.post');
                            $replyBox.removeClass('loading');
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        if (xhr.status == 403) {
                            ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                if (result) {
                                    var response = $.parseJSON(xhr.responseText);
                                    window.location = response.logInUrl;
                                }
                            });
                        }
                    }
                });
            });

            // Reply cancel
            $replyBox.on('click', '.cancel', closeReply);

            // New Post Intialization
            $newPostText.flexText();
            $newPostText.attr('placeholder', 'Write your reply here');

            // Add New Post 
            $newPostContainer.on('click', '.reply', function () {
                var replyOffset = $newPostContainer.offset();
                var $validationFields = $newPostContainer.find('.field-validation-error');
                if ($validationFields.length > 0) {
                    $validationFields.remove();
                }

                $newPostText.val($newPostText.val().trim());
                $newPostContainer.addClass('loading');

                $.ajax({
                    url: '/Discuss/Reply',
                    data: {
                        parentId: postId,
                        message: $newPostText.val(),
                        questionAuthorId: parseInt($('.question').attr('data-userId'))
                    },
                    method: 'post',
                    dataType: 'json',
                    success: function (response) {
                        if (response.success) {
                            $newPostContainer.removeClass('loading');
                            $newPostText.val('').keyup();

                            var $html = $(response.html);
                            $html.find('.date').text('a few seconds ago');
                            updateMessage($html.find('.message'));
                            var $firstUnvotedPost = $('#replies').find('.answer.post[data-votes="0"]').first();
                            if ($firstUnvotedPost.length > 0) {
                                $html.insertBefore($firstUnvotedPost);
                            }
                            else {
                                var $firstNegativeVotedPost = $('#replies').find('.post[data-state="negative"]').first();
                                if ($firstNegativeVotedPost.length > 0) {
                                    $html.insertBefore($firstNegativeVotedPost);
                                }
                                else {
                                    var $lastPost = $('#replies').find('.post:not(.question)').last();
                                    if ($lastPost.length > 0) {
                                        $html.insertAfter($lastPost);
                                    }
                                    else {
                                        $postList.append($html);
                                    }
                                }
                            }

                            window.layout.notifyResize();
                            var $newPost = $postList.children('[data-id=' + response.id + ']');
                            var newOffset = $newPost.offset();
                            $newPost.addClass('new elevated');
                            var translation = newOffset.top - replyOffset.top;
                            var translationDuration = Math.min(200 + Math.abs(translation), 1500);
                            $newPost.velocity({
                                translateY: [0, -translation]
                            }, {
                                easing: material.easings.swiftIn,
                                duration: translationDuration,
                                complete: function () {
                                    $newPost.removeClass('new elevated');
                                }
                            });
                            var windowHeight = $window.height();
                            var postHeight = $newPost.outerHeight();
                            var currentScroll = $window.scrollTop();
                            if (currentScroll < newOffset.top && newOffset.top < currentScroll + windowHeight - postHeight) {
                                // In view
                            } else {
                                var newScroll = Math.min(Math.max(0, newOffset.top - windowHeight + postHeight), $(document.body).outerHeight() - windowHeight);
                                //var scrollSize = newScroll - currentScroll;

                                $("html").velocity("scroll", {
                                    offset: newScroll + 'px',
                                    mobileHA: false,
                                    easing: material.easings.swiftIn,
                                    duration: translationDuration,
                                    //delay: translationDuration * (translation - scrollSize) / translation,
                                    //duration: translationDuration * scrollSize / translation
                                });
                            }

                            var count = parseInt($answersCount.text());
                            $answersCount.text(count + 1);
                            var label = count + 1 == 1 ? " Answer" : " Answers";
                            $asnwersCountLabel.text(label)
                            $newPostContainer.removeClass('noMargin');
                        }
                        else {
                            var $textWrap = $newPostText.closest('.text-wrap');
                            $textWrap.replaceWith(response.html);
                            $newPostText = $('#newPostMessage .replyText');
                            $newPostText.flexText();
                            $newPostContainer.removeClass('loading');
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        if (xhr.status == 403) {
                            ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                if (result) {
                                    var response = $.parseJSON(xhr.responseText);
                                    window.location = response.logInUrl;
                                }
                            });
                        }
                    }
                });
            });

            // Edit Post
            var $editPost = null;
            var $editPostText = null;
            var editPostOriginalText = '';

            function cancelEditPost() {
                if ($editPost == null) return;
                $editPost.removeClass('edit');
                var $message = $editPost.find('.message.text');
                $message.attr('data-value', editPostOriginalText.replace(/>/g, '&gt;').replace(/</g, '&lt;')); //.replace(/\r\n|\r|\n/g, '<br />')
                updateMessage($message);
                $editPost = null;
                $editPostText = null;
            }

            // Post edit
            $postList.on('click', '.answer.post .edit', function () {
                cancelAll();
                $editPost = $(this).parents('.answer.post');
                $editPost.css('-webkit-transition-delay', '0ms, 0ms, 0ms, 0ms, 0ms').css('transition-delay', '0ms, 0ms, 0ms, 0ms, 0ms');
                $editPost.addClass('edit');
                var $text = $editPost.find('.message.text');
                editPostOriginalText = $text.attr('data-value').replace(/&gt;/g, '>').replace(/&lt;/g, '<'); //$('<div/>').html($text.attr('data-value')).html().replace(/&gt;/g, '>').replace(/&lt;/g, '<');
                console.log(editPostOriginalText);
                $text.html('<textarea></textarea>');
                editPostOriginalText = editPostOriginalText; //.replace(/\r?\n|\r/g, '').replace(/<br\/?>/g, '\n');
                $editPostText = $text.children().val(editPostOriginalText).flexText();
            });

            // Post save
            $postList.on('click', '.post .save', function () {
                if ($editPost == null) return;
                $editPostText.val($editPostText.val().trim());

                $.ajax({
                    url: '/Discuss/EditPost',
                    data: {
                        id: parseInt($editPost.attr('data-id')),
                        message: $editPostText.val()
                    },
                    method: 'post',
                    dateType: 'json',
                    success: function (response) {
                        if (response.success) {
                            $editPost.find('.date').text('a few seconds ago');
                            editPostOriginalText = $editPostText.val();
                            cancelEditPost();
                        }
                        else {
                            $editPostText.replaceWith(response.html)
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        if (xhr.status == 403) {
                            ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                if (result) {
                                    var response = $.parseJSON(xhr.responseText);
                                    window.location = response.logInUrl;
                                }
                            });
                        }
                    }
                });
            });

            // Post delete
            $postList.on('click', '.answer.post .delete', function () {
                if ($editPost == null) return;
                ConfirmPopup.open("Are you sure you want to delete this post?", "Yes", "No", function (result) {
                    if (result) {
                        $.ajax({
                            url: '/Discuss/DeletePost',
                            data: {
                                postId: $editPost.attr('data-id')
                            },
                            method: 'post',
                            dateType: 'json',
                            success: function (response) {
                                if (response.success) {
                                    $editPost.remove();
                                    layout.notifyResize();
                                    var count = parseInt($answersCount.text());
                                    $answersCount.text(count - 1);
                                    var label = count - 1 == 1 ? " Answer" : " Answers";
                                    $asnwersCountLabel.text(label)
                                    $newPostContainer.toggleClass('noMargin', (count - 1) == 0);
                                }
                            },
                            error: function (xhr, ajaxOptions, thrownError) {
                                if (xhr.status == 403) {
                                    ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                        if (result) {
                                            var response = $.parseJSON(xhr.responseText);
                                            window.location = response.logInUrl;
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            });

            // Post edit cancel
            $postList.on('click', '.post .cancel', function () {
                cancelEditPost();
            });

            //Vote Post
            var enabled = true;

            $thread.on('click', '.postVotes div', function () {
                if (enabled) {
                    enabled = false;

                    var $this = $(this);
                    var $postContainer = $this.closest('.post');
                    var $voteContainer = $this.parent();
                    var $votes = $voteContainer.find('p');
                    var postId = parseInt($postContainer.attr('data-id'));


                    var vote = 0;
                    var myVote = parseInt($this.attr('data-value'));

                    if ($voteContainer.children().hasClass('active')) {
                        var $activeElement = $voteContainer.find('.active');
                        vote = parseInt($activeElement.attr('data-value'));
                    }

                    if ($this.hasClass('active')) {
                        $this.removeClass('active');
                        myVote = 0;
                    }
                    else {
                        $voteContainer.find('div').removeClass('active');
                        $this.addClass('active');
                    }


                    $.ajax({
                        url: '/Discuss/VotePost/',
                        data: {
                            postId: postId,
                            vote: myVote
                        },
                        type: 'POST',
                        dataType: 'json',
                        success: function (data) {
                            if (data.success) {
                                var votes = parseInt($votes.text()) + myVote - vote;
                                var isPositive = votes > 0;
                                var text = isPositive ? "+" + votes + "" : votes;
                                $votes.toggleClass('positive', isPositive);
                                $votes.text(text);
                                enabled = true;
                            }
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            if (xhr.status == 403) {
                                var response = xhr.responseJSON;
                                if (response.hasOwnProperty('isActivated') && !response.isActivated) {
                                    ErrorPopup.open("Please activate your account to perform this action. <br /> Activation instructions have been sent to your email.", "OK", function (result) {
                                        $voteContainer.find('div').removeClass('active');
                                        enabled = true;
                                    });
                                }
                                else if (response.hasOwnProperty('logInUrl')) {
                                    ErrorPopup.open("Your session has expired. Please log-in again", "LogIn", function (result) {
                                        if (result) {
                                            window.location = response.logInUrl;
                                        }
                                        else {
                                            enabled = true;
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
                else {
                    return;
                }
            });

            $thread.on('click', '.bestAnswer', function () {
                var $this = $(this);
                var $postContainer = $this.closest('.post');
                var postId = parseInt($postContainer.attr('data-id'));

                if (!$this.hasClass('editable')) return;

                var isAccepted = !$this.hasClass('accepted');

                if ($thread.find('.bestAnswer.accepted').length > 0) {
                    $thread.find('.bestAnswer.accepted').removeClass('accepted').addClass('base');
                }

                $this.toggleClass('accepted', isAccepted);

                $.ajax({
                    url: '/Discuss/AcceptAnswer',
                    data: {
                        postId: postId,
                        isAccepted: isAccepted
                    },
                    method: 'post',
                    dateType: 'json'//,
                    //success: function (response) {
                    //    if (response.success) {
                    //    }
                    //}
                });
            });

            $thread.on('change', '#repliesOrdering', function () {
                loader.emptyList();
                loader.invalidate();
            });
        }
    }
});