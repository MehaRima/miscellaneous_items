/*
* jQuery UI Nested Sortable
* v 2.1a / 2016-02-04
* https://github.com/ilikenwf/nestedSortable
*
* Depends on:
*	 jquery.ui.sortable.js 1.10+
*
* Copyright (c) 2010-2016 Manuele J Sarfatti and contributors
* Licensed under the MIT License
* http://www.opensource.org/licenses/mit-license.php
*/
(function( factory ) {
"use strict";
if ( typeof define === "function" && define.amd ) {
define([
"jquery",
"jquery-ui/sortable"
], factory );
} else {
factory( window.jQuery );
}
}(function($) {
"use strict";
function isOverAxis( x, reference, size ) {
return ( x > reference ) && ( x < ( reference + size ) );
}
$.widget("mjs.nestedSortable", $.extend({}, $.ui.sortable.prototype, {
options: {
disableParentChange: false,
doNotClear: false,
expandOnHover: 700,
isAllowed: function() { return true; },
isTree: false,
listType: "ol",
maxLevels: 0,
protectRoot: false,
rootID: null,
rtl: false,
startCollapsed: false,
tabSize: 20,
branchClass: "mjs-nestedSortable-branch",
collapsedClass: "mjs-nestedSortable-collapsed",
disableNestingClass: "mjs-nestedSortable-no-nesting",
errorClass: "mjs-nestedSortable-error",
expandedClass: "mjs-nestedSortable-expanded",
hoveringClass: "mjs-nestedSortable-hovering",
leafClass: "mjs-nestedSortable-leaf",
disabledClass: "mjs-nestedSortable-disabled"
},
_create: function() {
var self = this,
err;
this.element.data("ui-sortable", this.element.data("mjs-nestedSortable"));
if (!this.element.is(this.options.listType)) {
err = "nestedSortable: " +
"Please check that the listType option is set to your actual list type";
throw new Error(err);
}
if (this.options.isTree && this.options.expandOnHover) {
this.options.tolerance = "intersect";
}
$.ui.sortable.prototype._create.apply(this, arguments);
if (this.options.isTree) {
$(this.items).each(function() {
var $li = this.item,
hasCollapsedClass = $li.hasClass(self.options.collapsedClass),
hasExpandedClass = $li.hasClass(self.options.expandedClass);
if ($li.children(self.options.listType).length) {
$li.addClass(self.options.branchClass);
if ( !hasCollapsedClass && !hasExpandedClass ) {
if (self.options.startCollapsed) {
$li.addClass(self.options.collapsedClass);
} else {
$li.addClass(self.options.expandedClass);
}
}
} else {
$li.addClass(self.options.leafClass);
}
});
}
},
_destroy: function() {
this.element
.removeData("mjs-nestedSortable")
.removeData("ui-sortable");
return $.ui.sortable.prototype._destroy.apply(this, arguments);
},
_mouseDrag: function(event) {
var i,
item,
itemElement,
intersection,
self = this,
o = this.options,
scrolled = false,
$document = $(document),
previousTopOffset,
parentItem,
level,
childLevels,
itemAfter,
itemBefore,
newList,
method,
a,
previousItem,
nextItem,
helperIsNotSibling;
this.position = this._generatePosition(event);
this.positionAbs = this._convertPositionTo("absolute");
if (!this.lastPositionAbs) {
this.lastPositionAbs = this.positionAbs;
}
if (this.options.scroll) {
if (this.scrollParent[0] !== document && this.scrollParent[0].tagName !== "HTML") {
if (
(
this.overflowOffset.top +
this.scrollParent[0].offsetHeight
) -
event.pageY <
o.scrollSensitivity
) {
scrolled = this.scrollParent.scrollTop() + o.scrollSpeed;
this.scrollParent.scrollTop(scrolled);
} else if (
event.pageY -
this.overflowOffset.top <
o.scrollSensitivity
) {
scrolled = this.scrollParent.scrollTop() - o.scrollSpeed;
this.scrollParent.scrollTop(scrolled);
}
if (
(
this.overflowOffset.left +
this.scrollParent[0].offsetWidth
) -
event.pageX <
o.scrollSensitivity
) {
scrolled = this.scrollParent.scrollLeft() + o.scrollSpeed;
this.scrollParent.scrollLeft(scrolled);
} else if (
event.pageX -
this.overflowOffset.left <
o.scrollSensitivity
) {
scrolled = this.scrollParent.scrollLeft() - o.scrollSpeed;
this.scrollParent.scrollLeft(scrolled);
}
} else {
if (
event.pageY -
$document.scrollTop() <
o.scrollSensitivity
) {
scrolled = $document.scrollTop() - o.scrollSpeed;
$document.scrollTop(scrolled);
} else if (
$(window).height() -
(
event.pageY -
$document.scrollTop()
) <
o.scrollSensitivity
) {
scrolled = $document.scrollTop() + o.scrollSpeed;
$document.scrollTop(scrolled);
}
if (
event.pageX -
$document.scrollLeft() <
o.scrollSensitivity
) {
scrolled = $document.scrollLeft() - o.scrollSpeed;
$document.scrollLeft(scrolled);
} else if (
$(window).width() -
(
event.pageX -
$document.scrollLeft()
) <
o.scrollSensitivity
) {
scrolled = $document.scrollLeft() + o.scrollSpeed;
$document.scrollLeft(scrolled);
}
}
if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour) {
$.ui.ddmanager.prepareOffsets(this, event);
}
}
this.positionAbs = this._convertPositionTo("absolute");
previousTopOffset = this.placeholder.offset().top;
if (!this.options.axis || this.options.axis !== "y") {
this.helper[0].style.left = this.position.left + "px";
}
if (!this.options.axis || this.options.axis !== "x") {
this.helper[0].style.top = (this.position.top) + "px";
}
this.hovering = this.hovering ? this.hovering : null;
this.mouseentered = this.mouseentered ? this.mouseentered : false;
(function() {
var _parentItem = this.placeholder.parent().parent();
if (_parentItem && _parentItem.closest(".ui-sortable").length) {
parentItem = _parentItem;
}
}.call(this));
level = this._getLevel(this.placeholder);
childLevels = this._getChildLevels(this.helper);
newList = document.createElement(o.listType);
for (i = this.items.length - 1; i >= 0; i--) {
item = this.items[i];
itemElement = item.item[0];
intersection = this._intersectsWithPointer(item);
if (!intersection) {
continue;
}
if (item.instance !== this.currentContainer) {
continue;
}
if (itemElement.className.indexOf(o.disabledClass) !== -1) {
if (intersection === 2) {
itemAfter = this.items[i + 1];
if (itemAfter && itemAfter.item.hasClass(o.disabledClass)) {
continue;
}
} else if (intersection === 1) {
itemBefore = this.items[i - 1];
if (itemBefore && itemBefore.item.hasClass(o.disabledClass)) {
continue;
}
}
}
method = intersection === 1 ? "next" : "prev";
if (itemElement !== this.currentItem[0] &&
this.placeholder[method]()[0] !== itemElement &&
!$.contains(this.placeholder[0], itemElement) &&
(
this.options.type === "semi-dynamic" ?
!$.contains(this.element[0], itemElement) :
true
)
) {
if (!this.mouseentered) {
$(itemElement).mouseenter();
this.mouseentered = true;
}
if (o.isTree && $(itemElement).hasClass(o.collapsedClass) && o.expandOnHover) {
if (!this.hovering) {
$(itemElement).addClass(o.hoveringClass);
this.hovering = window.setTimeout(function() {
$(itemElement)
.removeClass(o.collapsedClass)
.addClass(o.expandedClass);
self.refreshPositions();
self._trigger("expand", event, self._uiHash());
}, o.expandOnHover);
}
}
this.direction = intersection === 1 ? "down" : "up";
if (this.options.tolerance === "pointer" || this._intersectsWithSides(item)) {
$(itemElement).mouseleave();
this.mouseentered = false;
$(itemElement).removeClass(o.hoveringClass);
if (this.hovering) {
window.clearTimeout(this.hovering);
}
this.hovering = null;
if (o.protectRoot &&
!(
this.currentItem[0].parentNode === this.element[0] &&
itemElement.parentNode !== this.element[0]
)
) {
if (this.currentItem[0].parentNode !== this.element[0] &&
itemElement.parentNode === this.element[0]
) {
if ( !$(itemElement).children(o.listType).length) {
itemElement.appendChild(newList);
if (o.isTree) {
$(itemElement)
.removeClass(o.leafClass)
.addClass(o.branchClass + " " + o.expandedClass);
}
}
if (this.direction === "down") {
a = $(itemElement).prev().children(o.listType);
} else {
a = $(itemElement).children(o.listType);
}
if (a[0] !== undefined) {
this._rearrange(event, null, a);
}
} else {
this._rearrange(event, item);
}
} else if (!o.protectRoot) {
this._rearrange(event, item);
}
} else {
break;
}
this._clearEmpty(itemElement);
this._trigger("change", event, this._uiHash());
break;
}
}
(function() {
var _previousItem = this.placeholder.prev();
if (_previousItem.length) {
previousItem = _previousItem;
} else {
previousItem = null;
}
}.call(this));
if (previousItem != null) {
while (
previousItem[0].nodeName.toLowerCase() !== "li" ||
previousItem[0].className.indexOf(o.disabledClass) !== -1 ||
previousItem[0] === this.currentItem[0] ||
previousItem[0] === this.helper[0]
) {
if (previousItem[0].previousSibling) {
previousItem = $(previousItem[0].previousSibling);
} else {
previousItem = null;
break;
}
}
}
(function() {
var _nextItem = this.placeholder.next();
if (_nextItem.length) {
nextItem = _nextItem;
} else {
nextItem = null;
}
}.call(this));
if (nextItem != null) {
while (
nextItem[0].nodeName.toLowerCase() !== "li" ||
nextItem[0].className.indexOf(o.disabledClass) !== -1 ||
nextItem[0] === this.currentItem[0] ||
nextItem[0] === this.helper[0]
) {
if (nextItem[0].nextSibling) {
nextItem = $(nextItem[0].nextSibling);
} else {
nextItem = null;
break;
}
}
}
this.beyondMaxLevels = 0;
if (parentItem != null &&
nextItem == null &&
!(o.protectRoot && parentItem[0].parentNode == this.element[0]) &&
(
o.rtl &&
(
this.positionAbs.left +
this.helper.outerWidth() > parentItem.offset().left +
parentItem.outerWidth()
) ||
!o.rtl && (this.positionAbs.left < parentItem.offset().left)
)
) {
parentItem.after(this.placeholder[0]);
helperIsNotSibling = !parentItem
.children(o.listItem)
.children("li:visible:not(.ui-sortable-helper)")
.length;
if (o.isTree && helperIsNotSibling) {
parentItem
.removeClass(this.options.branchClass + " " + this.options.expandedClass)
.addClass(this.options.leafClass);
}
if(typeof parentItem !== 'undefined')
this._clearEmpty(parentItem[0]);
this._trigger("change", event, this._uiHash());
} else if (previousItem != null &&
!previousItem.hasClass(o.disableNestingClass) &&
(
previousItem.children(o.listType).length &&
previousItem.children(o.listType).is(":visible") ||
!previousItem.children(o.listType).length
) &&
!(o.protectRoot && this.currentItem[0].parentNode === this.element[0]) &&
(
o.rtl &&
(
this.positionAbs.left +
this.helper.outerWidth() <
previousItem.offset().left +
previousItem.outerWidth() -
o.tabSize
) ||
!o.rtl &&
(this.positionAbs.left > previousItem.offset().left + o.tabSize)
)
) {
this._isAllowed(previousItem, level, level + childLevels + 1);
if (!previousItem.children(o.listType).length) {
previousItem[0].appendChild(newList);
if (o.isTree) {
previousItem
.removeClass(o.leafClass)
.addClass(o.branchClass + " " + o.expandedClass);
}
}
if (previousTopOffset && (previousTopOffset <= previousItem.offset().top)) {
previousItem.children(o.listType).prepend(this.placeholder);
} else {
previousItem.children(o.listType)[0].appendChild(this.placeholder[0]);
}
if(typeof parentItem !== 'undefined')
this._clearEmpty(parentItem[0]);
this._trigger("change", event, this._uiHash());
} else {
this._isAllowed(parentItem, level, level + childLevels);
}
this._contactContainers(event);
if ($.ui.ddmanager) {
$.ui.ddmanager.drag(this, event);
}
this._trigger("sort", event, this._uiHash());
this.lastPositionAbs = this.positionAbs;
return false;
},
_mouseStop: function(event) {
if (this.beyondMaxLevels) {
this.placeholder.removeClass(this.options.errorClass);
if (this.domPosition.prev) {
$(this.domPosition.prev).after(this.placeholder);
} else {
$(this.domPosition.parent).prepend(this.placeholder);
}
this._trigger("revert", event, this._uiHash());
}
$("." + this.options.hoveringClass)
.mouseleave()
.removeClass(this.options.hoveringClass);
this.mouseentered = false;
if (this.hovering) {
window.clearTimeout(this.hovering);
}
this.hovering = null;
this._relocate_event = event;
this._pid_current = $(this.domPosition.parent).parent().attr("id");
this._sort_current = this.domPosition.prev ? $(this.domPosition.prev).next().index() : 0;
$.ui.sortable.prototype._mouseStop.apply(this, arguments); //asybnchronous execution, @see _clear for the relocate event.
},
_intersectsWithSides: function(item) {
var half = this.options.isTree ? .8 : .5,
isOverBottomHalf = isOverAxis(
this.positionAbs.top + this.offset.click.top,
item.top + (item.height * half),
item.height
),
isOverTopHalf = isOverAxis(
this.positionAbs.top + this.offset.click.top,
item.top - (item.height * half),
item.height
),
isOverRightHalf = isOverAxis(
this.positionAbs.left + this.offset.click.left,
item.left + (item.width / 2),
item.width
),
verticalDirection = this._getDragVerticalDirection(),
horizontalDirection = this._getDragHorizontalDirection();
if (this.floating && horizontalDirection) {
return (
(horizontalDirection === "right" && isOverRightHalf) ||
(horizontalDirection === "left" && !isOverRightHalf)
);
} else {
return verticalDirection && (
(verticalDirection === "down" && isOverBottomHalf) ||
(verticalDirection === "up" && isOverTopHalf)
);
}
},
_contactContainers: function() {
if (this.options.protectRoot && this.currentItem[0].parentNode === this.element[0] ) {
return;
}
$.ui.sortable.prototype._contactContainers.apply(this, arguments);
},
_clear: function() {
var i,
item;
$.ui.sortable.prototype._clear.apply(this, arguments);
if (!(this._pid_current === this._uiHash().item.parent().parent().attr("id") &&
this._sort_current === this._uiHash().item.index())) {
this._trigger("relocate", this._relocate_event, this._uiHash());
}
for (i = this.items.length - 1; i >= 0; i--) {
item = this.items[i].item[0];
this._clearEmpty(item);
}
},
serialize: function(options) {
var o = $.extend({}, this.options, options),
items = this._getItemsAsjQuery(o && o.connected),
str = [];
$(items).each(function() {
var res = ($(o.item || this).attr(o.attribute || "id") || "")
.match(o.expression || (/(.+)[-=_](.+)/)),
pid = ($(o.item || this).parent(o.listType)
.parent(o.items)
.attr(o.attribute || "id") || "")
.match(o.expression || (/(.+)[-=_](.+)/));
if (res) {
str.push(
(
(o.key || res[1]) +
"[" +
(o.key && o.expression ? res[1] : res[2]) + "]"
) +
"=" +
(pid ? (o.key && o.expression ? pid[1] : pid[2]) : o.rootID));
}
});
if (!str.length && o.key) {
str.push(o.key + "=");
}
return str.join("&");
},
toHierarchy: function(options) {
var o = $.extend({}, this.options, options),
ret = [];
$(this.element).children(o.items).each(function() {
var level = _recursiveItems(this);
ret.push(level);
});
return ret;
function _recursiveItems(item) {
var id = ($(item).attr(o.attribute || "id") || "").match(o.expression || (/(.+)[-=_](.+)/)),
currentItem;
var data = $(item).data();
if (data.nestedSortableItem) {
delete data.nestedSortableItem; // Remove the nestedSortableItem object from the data
}
if (id) {
currentItem = {
"id": id[2]
};
currentItem = $.extend({}, currentItem, data); // Combine the two objects
if ($(item).children(o.listType).children(o.items).length > 0) {
currentItem.children = [];
$(item).children(o.listType).children(o.items).each(function() {
var level = _recursiveItems(this);
currentItem.children.push(level);
});
}
return currentItem;
}
}
},
toArray: function(options) {
var o = $.extend({}, this.options, options),
sDepth = o.startDepthCount || 0,
ret = [],
left = 1;
if (!o.excludeRoot) {
ret.push({
"item_id": o.rootID,
"parent_id": null,
"depth": sDepth,
"left": left,
"right": ($(o.items, this.element).length + 1) * 2
});
left++;
}
$(this.element).children(o.items).each(function() {
left = _recursiveArray(this, sDepth, left);
});
ret = ret.sort(function(a, b) { return (a.left - b.left); });
return ret;
function _recursiveArray(item, depth, _left) {
var right = _left + 1,
id,
pid,
parentItem;
if ($(item).children(o.listType).children(o.items).length > 0) {
depth++;
$(item).children(o.listType).children(o.items).each(function() {
right = _recursiveArray($(this), depth, right);
});
depth--;
}
id = ($(item).attr(o.attribute || "id") || "").match(o.expression || (/(.+)[-=_](.+)/));
if (depth === sDepth) {
pid = o.rootID;
} else {
parentItem = ($(item).parent(o.listType)
.parent(o.items)
.attr(o.attribute || "id"))
.match(o.expression || (/(.+)[-=_](.+)/));
pid = parentItem[2];
}
if (id) {
var data = $(item).children('div').data();
var itemObj = $.extend( data, {
"id":id[2],
"parent_id":pid,
"depth":depth,
"left":_left,
"right":right
} );
ret.push( itemObj );
}
_left = right + 1;
return _left;
}
},
_clearEmpty: function (item) {
function replaceClass(elem, search, replace, swap) {
if (swap) {
search = [replace, replace = search][0];
}
$(elem).removeClass(search).addClass(replace);
}
var o = this.options,
childrenList = $(item).children(o.listType),
hasChildren = childrenList.has('li').length;
var doNotClear =
o.doNotClear ||
hasChildren ||
o.protectRoot && $(item)[0] === this.element[0];
if (o.isTree) {
replaceClass(item, o.branchClass, o.leafClass, doNotClear);
}
if (!doNotClear) {
childrenList.parent().removeClass(o.expandedClass);
childrenList.remove();
}
},
_getLevel: function(item) {
var level = 1,
list;
if (this.options.listType) {
list = item.closest(this.options.listType);
while (list && list.length > 0 && !list.is(".ui-sortable")) {
level++;
list = list.parent().closest(this.options.listType);
}
}
return level;
},
_getChildLevels: function(parent, depth) {
var self = this,
o = this.options,
result = 0;
depth = depth || 0;
$(parent).children(o.listType).children(o.items).each(function(index, child) {
result = Math.max(self._getChildLevels(child, depth + 1), result);
});
return depth ? result + 1 : result;
},
_isAllowed: function(parentItem, level, levels) {
var o = this.options,
maxLevels = this
.placeholder
.closest(".ui-sortable")
.nestedSortable("option", "maxLevels"),
oldParent = this.currentItem.parent().parent(),
disabledByParentchange = o.disableParentChange && (
typeof parentItem !== 'undefined' && !oldParent.is(parentItem) ||
typeof parentItem === 'undefined' && oldParent.is("li")	//From somewhere to the root
);
if (
disabledByParentchange ||
!o.isAllowed(this.placeholder, parentItem, this.currentItem)
) {
this.placeholder.addClass(o.errorClass);
if (maxLevels < levels && maxLevels !== 0) {
this.beyondMaxLevels = levels - maxLevels;
} else {
this.beyondMaxLevels = 1;
}
} else {
if (maxLevels < levels && maxLevels !== 0) {
this.placeholder.addClass(o.errorClass);
this.beyondMaxLevels = levels - maxLevels;
} else {
this.placeholder.removeClass(o.errorClass);
this.beyondMaxLevels = 0;
}
}
}
}));
$.mjs.nestedSortable.prototype.options = $.extend(
{},
$.ui.sortable.prototype.options,
$.mjs.nestedSortable.prototype.options
);
}));var isWizardChange = false;
var isPreviewReload = false;
var typingTimer;                //timer identifier
var doneTypingInterval = 3000;  //time in ms, 5 second for example
var wizardReadyToGo = false; //Tell us if we can start working with the wizard (this var make sure everything is load properly)
var viewButtonReload = false; //Tell us if the user click on the 'EYE' (preview) button inside the module window. If so we don't reload the website preview with bootstrap event for HIDE
var disableLeavePopup = false;
var tools_manage_is_change = false;
var recommendedImagesLoading_start = false;
var RecommendedImagesPage = 1;
var imageAttributesResult_global = '';
var imageHomepageLiveEleID = '';
var holdWizardSave = false;
var existingTitle1;
var existingTitle2;
var existingTitle3;
var existingHomeButton1;
var existingHomeButton2;
var userActive_timeoutTime      = 60000;
var userActive_timeoutTimer     = setTimeout(userActive_ShowTimeOutWarning, userActive_timeoutTime);
var userActive_isActive         = true;
var userActive_ForceWebsiteNotifications     = setTimeout(userActive_ForceWebsiteNotifications, 300000);
var WizardAddImagesToHistory = new function() {
var that = this;
/**
* Initialize the object
*/
that.init = function( settings ) {
that.websiteID = settings.websiteID;
that.dataBase = that.websiteID+'_ImagesHistory';
that.supported = false;
that.disabled = false;
that.tableNameSpace = 'history';
that.$container = settings.$container;
createDataBase();
};
that.add = function(previewURL,imageURL) {
if ( !that.supported ) return;
if ( that.disabled ) return;
var exist = false;
var imageExistHandler = that.objectStore.each(function(item) {
if ( imageURL == item.value[1] ) {
exist = true;
return;
}
}).done(function(result, event){
if ( !exist ) {
var dataObj = [previewURL,imageURL];
that.objectStore.add(dataObj,that.index).done(function( result, event ){
that.index++;
that.ShowUserImageShortCutInStyleImage($('#BackgroundTabHomepage'));
});
}
});
};
/**
* The method is showing the last used images container only if it has images
*/
that.show = function() {
if ( !that.supported ) return;
if ( that.disabled ) return;
if ( that.$container.find('.recommendedImagesItem').length === 0 ) return;
that.$container.show();
};
/**
* The method is hiding the last used images container
*/
that.hide = function() {
that.$container.hide();
};
function GetAllImages($ele) {
if (!that.supported) return;
var allImages = new Array();
var range = '';
var direction = true;
var $lastImagesContent = $ele.find('.lastImages .boxContent');
var iterationPromise = that.objectStore.each(function(item) {
allImages.push(item);
});
iterationPromise.done(function(result, event){
allImages = allImages.reverse();
var length = allImages.length;
if ( length > 4 ) length = 4;
$lastImagesContent.empty();
for (var i = 0; i < length; i++) {
var item        = allImages[i];
var previewURL  = item.value[0];
var imageURL    = item.value[1];
var $html      = $('<div class="col-xs-3"><div class="recommendedImagesItem"><img src="'+previewURL+'" data-full-image="'+imageURL+'"></div></div>');
$lastImagesContent.append($html);
$html.find('img').on('click',function() {
var $this = $(this);
homepage_PickNewObjectToHomepageBackground(false,$this.parent('.recommendedImagesItem'),$this.attr('src'),$this.data('full-image'),null,'images');
});
}
that.show();
});
}
function GetLastKeyFromDB() {
if (!that.supported) return; //indexedDB not supported
var getLastKey = -1;
var iterationPromise = that.objectStore.each(function(item) {
getLastKey = item.key;
});
iterationPromise.done(function(result, event){
that.index = getLastKey+1;
});
}
that.ShowUserImageShortCutInStyleImage = function($ele) {
if (!that.supported) return; //indexedDB not supported
var allImages = GetAllImages($ele);
}
/**
* The function is creating a new database after the old data base has been deleted
*/
function createDataBase() {
that.indexedDB = $.indexedDB(that.dataBase, {
"schema": {
"1": function( versionTransaction ) {
versionTransaction.createObjectStore(that.tableNameSpace);
}
}
});
that.indexedDB.done(function( db, event ) {
that.supported = true;
that.objectStore = that.indexedDB.objectStore(that.tableNameSpace,'readwrite');
GetLastKeyFromDB();
that.ShowUserImageShortCutInStyleImage($('#BackgroundTabHomepage'));
convertOldIndexedDBToNew();
});
that.indexedDB.fail(function( db, event ) {
that.supported = false;
});
}
/***
* The function is responsible for converting the old indexedDB version of the images history
* plugin to the new version for users that have it.
*/
function convertOldIndexedDBToNew() {
var oldIndexedDB = $.indexedDB('ImagesHistory');
oldIndexedDB.done(function( db, event ) {
var index = 0;
if ( db.objectStoreNames[0] === that.websiteID+'_history' ) {
oldIndexedDB.objectStore(db.objectStoreNames[0],'readwrite').each(function( item ) {
that.objectStore.add([item.value[0],item.value[1]],index);
index ++;
GetLastKeyFromDB();
}).done(function() {
that.ShowUserImageShortCutInStyleImage($('#BackgroundTabHomepage'));
oldIndexedDB.deleteDatabase();
});
} else {
oldIndexedDB.deleteDatabase();
}
});
}
}
/**
* Jquery IndexedDB Documentation: https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
*
* Undo And Redo Handler - The plugin is managing the user changes in the local browser database called indexedDB.
*
* Instructions: On initialing the plugin there are 2 properties:
*  1. dataBase - The name of the table that will be created.
*  2. $buttonsContainer - To what container the plugin need to add the undo / redo buttons
*
* Usage:
* 1. Call the method `add()` to add new records.
* 1. In order to disable the buttons call the method `buttonsEnable()` `buttonsDisable()`.
*/
var WizardUndoRedoHandler = new function() {
var that = this;
/**
* Initialize the object
*/
that.init = function( settings ) {
if ( !settings.$buttonsContainer || !settings.dataBase ) return;
that.dataBase = settings.dataBase;
that.$buttonsContainer = settings.$buttonsContainer;
that.index = 0;
that.skipSave = false;
that.pageLoad = true;
that.tableNameSpace = 'undo';
that.isDisable = true;
that.isSupported = true;
that.firstRecord = false;
if ( $('html').data('device') !== 'computer' ) return;
var deletePromise = $.indexedDB(that.dataBase).deleteDatabase();
deletePromise.done(function( event ) {
createDataBase();
});
deletePromise.fail(function( error ) {
that.isSupported = false;
});
};
/**
* The method is reseting all the database from the old data and saving the current
* data to the undo.
*/
that.reset = function() {
if ( isDisabled() ) return;
if ( !that.isSupported ) return;
var iterationPromise = that.objectStore.each(function( item ){
if ( item.key > that.index ) item.delete();
});
};
/**
* The method is responsible for adding a new record to the `indexedDB`
*/
that.add = function() {
if ( isDisabled() ) return;
if ( !that.isSupported ) return;
if ( that.inProgress ) return;
/**
* Progress Issue - This method can't run simultaneously but the `SaveWizard` function is running in some cases simultaneously
* because we have a wrong behaving in the wizard so we decided to reject the irrelevant calls.
*/
that.inProgress = true;
/* when the user is selecting homepage style or homepage image that have external url such as unsplash or pixabay
we are downloading it the image and then we are calling again to the function `SaveWizard` that is calling this method, as result we had 2 same records but with a different homepage image url, one of the usnplash or pixabay and one of our cdn so we decided to skip the saving after downloading the images to our cdn.  */
if ( that.skipSave ) {
that.skipSave = false;
return;
}
/* always run the reset method because when the user is making changes we need to reset the redo functionality starting
starting from the current undo */
that.reset();
var data = tryParseJSON(that.getSupportedFields());
/**
* if the data that the user have at the moment is the same as the last one he saved skip the current saving
* Note: Related to wizard multiple saving issue, it was creating duplicated records in the indexedDB also.
*
* Solution how to compare 2 objects: https://stackoverflow.com/a/1144249
*/
if ( JSON.stringify(tryParseJSON(that.lastSave)) === JSON.stringify(data) ) {
that.inProgress = false;
return;
}
/**
* First Refresh Type Bug Fix - When the user was undoing all the changes to the first time his wizard is loaded
* we couldn't know what is the refresh type we need to refresh the preview so we fixed that by saving the first record in the
* memory and insert it to the data base before we insert the new changes of the user, this way we know what is the refresh type
* we need to show the user when he is undoing all of his changes.
*/
if ( that.firstRecord ) {
that.firstRecord.wizardUndoRefreshHelper = $('#wizardUndoRefreshHelper').val();
save(that.firstRecord,false);
that.firstRecord = false;
}
that.index ++;
var promise = that.objectStore.get(that.index);
getLastSave();
promise.done(function(result, event) {
var overwrite = false;
/* if we have already data in that index we need to overwrite it instead of creating new record
because of the following flow: change something >> undo >> change again something */
if ( result ) overwrite = true;
save(data,overwrite);
that.inProgress = false;
});
};
/**
* The method is disabling the buttons of the plugin
*/
that.buttonsDisable = function() {
if ( !that.isSupported ) return;
/* when the page is loading we still don't have the buttons but the user can already
click on the tabs so we don't need to do anything */
if ( !that.$undoBtn && !that.$redoBtn ) return;
that.$undoBtn.addClass('disabled');
that.$redoBtn.addClass('disabled');
};
/**
* The method is enabling the buttons of the plugin
*/
that.buttonsEnable = function() {
if ( isDisabled() ) return;
if ( !that.isSupported ) return;
/* when the page is loading we still don't have the buttons but the user can already
click on the tabs so we don't need to do anything */
if ( !that.$undoBtn && !that.$redoBtn ) return;
disableEnableButtons();
};
/**
* The method is responsible for enabling the plugin
*/
that.enable = function() {
return;
if ( !that.isSupported ) return;
that.isDisable = false;
that.buttonsEnable();
};
/**
* The method is responsible for disabling the plugin completely
*/
that.disable = function() {
if ( !that.isSupported ) return;
that.isDisable = true;
that.buttonsDisable();
};
/**
* The function is checking if the plugin is disabled and returning a boolean
*
* @param {boolean} unnamed - True for disabled / False for enabled
*/
function isDisabled() {
if ( that.isDisable ) return true;
if ( $('html').data('device') !== 'computer' ) return true;
return false;
}
/**
* The function is creating a new database after the old data base has been deleted
*/
function createDataBase() {
that.indexedDB = $.indexedDB(that.dataBase, {
"schema": {
"1": function( versionTransaction ) {
versionTransaction.createObjectStore(that.tableNameSpace);
}
}
});
that.indexedDB.done(function( db, event ) {
that.objectStore = that.indexedDB.objectStore(that.tableNameSpace,'readwrite');
var promise = that.objectStore.clear();
promise.done(function( result, event ){
that.firstRecord = tryParseJSON(that.getSupportedFields());
addButtons();
getLastSave();
});
});
}
/**
* The function is saving the current changes to the `indexedDB`
*
* @param {object} data - Undo object
* @param {boolean} overwrite - true / false
*/
function save( data, overwrite ) {
var promise = null;
if ( that.pageLoad ) {
that.index = 0;
that.pageLoad = false;
} else {
that.$undoBtn.show();
that.$redoBtn.show();
}
if ( overwrite ) {
promise = that.objectStore.put(data,that.index);
} else {
promise = that.objectStore.add(data,that.index);
}
}
/**
* The function is responsible for hiding or showing the undo button according to the records index
*/
function disableEnableButtons() {
if ( that.index >= 1 ) {
that.$undoBtn.removeClass('disabled');
} else {
that.$undoBtn.addClass('disabled');
}
var promise = that.objectStore.count();
promise.done(function( result, event ){
if ( that.index < result-1 ) {
that.$redoBtn.removeClass('disabled');
} else {
that.$redoBtn.addClass('disabled');
}
});
}
/**
* The function is adding the undo and redo buttons
*/
function addButtons() {
var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;
var undoText = isMac ? escapeHtml(translations.undo).replace('{{shortcut}}','&#8984;Z') : escapeHtml(translations.undo).replace('{{shortcut}}','Ctrl+Z') ;
var redoText = isMac ? escapeHtml(translations.redo).replace('{{shortcut}}','&#8984;Y') : escapeHtml(translations.redo).replace('{{shortcut}}','Ctrl+Y');
var $buttonsContainer = $('<div class="wizard-u-r-container"><a id="wizardUndo" data-rel="tooltip-desk" data-title="'+undoText+'" data-speech="on" data-speech-text="'+escapeHtml(translations.undo)+'" data-track="undo"><i class="fa fa-undo" aria-hidden="true"></i></a><a id="wizardRedo" data-rel="tooltip-desk" data-title="'+redoText+'" data-speech="on" data-speech-text="'+escapeHtml(translations.redo)+'" data-track="undo"><i class="fa fa-repeat" aria-hidden="true"></i></a></div>');
that.$buttonsContainer.append($buttonsContainer);
that.$undoBtn = $buttonsContainer.find('#wizardUndo');
mixPanelDataTrackInit();
that.$undoBtn.on('click', function() {
if ( !that.$undoBtn.is(':visible') || that.$undoBtn.hasClass('disabled') ) return;
that.index --;
var promise = that.objectStore.get(that.index);
that.buttonsDisable();
that.inProgress = true;
promise.done(function( newSettings, event ) {
/* get the previous settings of the user because we need to know what refresh type we need to show him
and it is stored in the record*/
promise = that.objectStore.get(that.index+1);
promise.done(function( prevSettings, event ) {
makeChanges(newSettings,prevSettings.wizardUndoRefreshHelper);
that.inProgress = false;
});
});
});
that.$redoBtn = $buttonsContainer.find('#wizardRedo');
that.$redoBtn.on('click', function() {
if ( !that.$redoBtn.is(':visible') || that.$redoBtn.hasClass('disabled') ) return;
that.index ++;
var promise = that.objectStore.get(that.index);
that.buttonsDisable();
that.inProgress = true;
promise.done(function( result, event ) {
makeChanges(result,result.wizardUndoRefreshHelper);
that.inProgress = false;
});
});
InitializeToolTips();
}
/**
* The function is responsible for updating the wizard changes after clicking on the undo button
*
* @param {object} dbSettings - The settings that the user had before the changes
* @param {string} wizardUndoRefreshHelper - Refresh type we need to stow
*/
function makeChanges( dbSettings, wizardUndoRefreshHelper ) {
if ( !dbSettings ) return;
var changedInputs = getChangedInputs(tryParseJSON(that.lastSave),dbSettings);
holdWizardSave = true;
$.each(dbSettings, function ( key, value ) {
var $input = $('#'+key);
/**
* check input type and set the correct value or property according to the input type
* for more methods to check the input type: https://stackoverflow.com/a/3165569
*/
switch ( $input.prop('type') ) {
case 'checkbox':
$input.prop('checked',value);
break;
default:
if ( $input.get(0).id === 'home_siteSlogan' ||
$input.get(0).id === 'home_siteSlogan_2' ||
$input.get(0).id === 'home_SecondSiteSlogan') {;
value = value.replace(/<br\/>/ig,"\n");
value = value.replace(/<br>/ig,"\n");
}
$input.val(value);
break;
}
/**
* Upload File Undo / Redo Handler - For upload files image types we also to refresh the inputs preview
* for example the remove image, focus point.
*
* Note: The upload file video type don't have a buttons so we don't need to do with it anything.
*/
if ( $input.hasClass('file-upload-input-field') && !$input.hasClass('home_video_background') ) {
uploadFileHandler($input);
}
});
/**
* The gradients and homepage background color are not working together and 1 of them will alway be empty
* but because the event of the inputs is resetting each other we don't want to include them in the undo
* when they are empty so the reset event won't happen.
*/
changedInputs = changedInputs.filter(function( $input ) {
if ( $input.get(0).id === 'home_background_color' && $input.val().length === 0 ) return false;
if ( $input.get(0).id === 'homepageGradientsColors' && $input.val().length === 0 ) return false;
return true;
});
/**
* After we have changed the all of the wizard settings we now need to refresh some additional
* abilities related to some specific changed inputs, e.g. website colors, accordions of homepage
* video, homepage buttons, homepage structure.
*/
$.each(changedInputs, function( index, $input ) {
/**
* Changed Inputs Handler - Some inputs attached to a `change` event that trigger
* some actions we must do when the input value is changed, so we must fire the
* change event to make those actions. Note: We can not fire the change event
* on all the inputs (also inputs that didn't changed) because some of them have
* other functionality, e.g. when changing "Layout Structure" its set some default
* values on other inputs, so CTRL + Y will have an issue.
*/
$input.trigger('change',[ "UndoRedoChange" ]);
if ( $input.get(0).id === 'homepageStructure' ) {
GetImageMainColors($('#home_slider_image_1').val().replace('normal_','400_'));
ShowHideTextLayoutElementsIfUnused();
Wizard.homePageBgOptions.showHideBackgroundOptions();
}
});
ShowHideTextLayoutElementsIfUnused();
holdWizardSave = false;
WizardRefreshHandler(changedInputs,wizardUndoRefreshHelper);
getLastSave();
}
/**
* The function is fetching the last saved data
*/
function getLastSave() {
that.lastSave = that.getSupportedFields();
}
/**
* The function is refreshing the upload file input preview on undo / redo action
*
* @param {jq object} $input - Upload file input we need to refresh
*/
function uploadFileHandler( $input ) {
var id = $input.get(0).id;
var image = $input.val();
var tiny_image = image.replace("normal_", "100_");
if ( image.indexOf('site123-image-icon') != -1 ) {
UpdateImagePreview(id, { icon: image });
} else {
UpdateImagePreview(id, { normal: image, tiny: tiny_image });
}
/**
* Website Full Box / Flying Full Box Background Image - On empty upload file we also need to
* hide or show the color box.
*/
if ( id === 'website_background_color_image' ) {
if ( image !== '' ) {
$('#website_background_color').closest('.form-group').hide();
} else {
$('#website_background_color').closest('.form-group').show();
}
}
}
/**
* The function is returning the changed inputs.
*
* @param {object} currentState - Old user settings.
* @param {object} newSettings - New user settings.
*/
function getChangedInputs( currentState, newSettings ) {
var $inputes = Array();
$.each(newSettings, function ( key, value ) {
if ( currentState[key] != newSettings[key] ) {
$inputes.push($('#'+key));
}
});
return $inputes;
}
/**
* The function is returning all of the supported fields by the undo plugin
*/
that.getSupportedFields = function() {
var more_settings_arr = [
'wizardUndoRefreshHelper',
'websiteStructureNUM',
'header_width',
'header_size',
'header_logo_back_color',
'header_font_style',
'menu_pages_style',
'menu_font_size',
'footer_layout',
'page_header_style',
'home_opacity',
'homepageFilterImage',
'header_opacity',
'header_style',
'home_third_background_color',
'homepageGradientsColors',
'home_start_image',
'homepage_goal',
'template',
'home_text_size',
'home_text_size_2',
'slogan_text_size',
'home_text_size_weight',
'home_text_italic',
'home_text_size_2_weight',
'home_text_2_italic',
'slogan_text_size_weight',
'slogan_text_italic',
'home_text_shadow_1',
'home_text_shadow_2',
'home_text_shadow_3',
'home_text_background_1',
'home_text_background_2',
'home_text_background_3',
'home_text_letter_spacing_1',
'home_text_letter_spacing_2',
'home_text_letter_spacing_3',
'home_text_word_spacing_1',
'home_text_word_spacing_2',
'home_text_word_spacing_3',
'home_text_rotate_1',
'home_text_rotate_2',
'home_text_rotate_3',
'home_text_line_height_1',
'home_text_line_height_2',
'home_text_line_height_3',
'home_text_bottom_space_1',
'home_text_bottom_space_2',
'home_text_bottom_space_3',
'homepage_style',
'home_background_color',
'home_text_color',
'home_text_animation_1',
'home_text_animation_2',
'home_text_animation_3',
'home_siteSlogan',
'home_siteSlogan_2',
'home_SecondSiteSlogan',
'font_slogan',
'font_slogan_2',
'font_second_slogan',
'home_buttonText',
'home_buttonText_style',
'home_buttonText_type',
'home_scrollSection',
'home_buttonText_icon',
'home_buttonText_1',
'home_buttonText_1_style',
'home_buttonText_1_type',
'home_scrollSection_1',
'home_buttonText_1_icon',
'videoType',
'home_video',
'home_custom_video',
'homepageTextCustomBoxStyle',
'global_main_color',
'menu_color',
'menu_text_color',
'menu_text_hover_color',
'menu_thin_border',
'module_separate_border_color',
'theme_style',
'modules_color',
'modules_color_text',
'modules_color_box',
'modules_color_text_box',
'modules_color_second',
'modules_color_text_second',
'modules_color_second_box',
'modules_color_text_second_box',
'footer_back',
'footer_text',
'buttons_radius',
'all_fonts',
'homepageShapeDivider',
'homepageShapeDividerList_Color1',
'homepageShapeDividerList_Size',
'homepageShapeDividerList_Mobile',
'name',
'logo_font_size',
'siteLogo_preview',
'siteLogo',
'siteLogoStyle',
'home_slider_image_1',
'home_slider_image_1_settings',
'home_slider_image_2',
'home_slider_image_2_settings',
'home_slider_image_3',
'home_slider_image_3_settings',
'home_slider_image_4',
'home_slider_image_4_settings',
'home_slider_image_5',
'home_slider_image_5_settings',
'home_slider_chaning_speed',
'home_start_image_settings',
'parallax_homepage_image',
'typographySize',
'website_background_color_image',
'website_background_type',
'website_background_color',
'customTemplate',
'homepageStructure',
'home_video_background',
'logo_img_size',
'siteLogoImageStyle',
'logo_text_letter_spacing',
'logo_text_word_spacing',
'logo_text_size_weight',
'logo_text_italic',
'homepage_layout_kind',
'layout_text_align',
'layout_text_position',
'layout_homepage_full_width',
'layout_text_box_width',
'layout_left_side_width',
'layout_bottom_spacing',
'homepage_goal_space',
'homepage_second_goal_space',
'homepage_layout_height',
'homepage_goal_type',
'homepage_goal_place',
'homepage_goal_position',
'homepage_second_goal_type',
'homepage_second_goal_place',
'home_custom_image',
'home_custom_image_size',
'home_upload_sound',
'video_popup_icon_style',
'home_embed_sound_cloud',
'embed_url_width_sound_cloud',
'embed_url_height_sound_cloud',
'home_embed_facebook_like_box',
'embed_url_width_facebook',
'embed_url_height_facebook',
'home_embed_twitter',
'embed_url_width_twitter',
'embed_url_height_twitter',
'home_embed_pinterest',
'embed_url_width_pinterest',
'embed_url_height_pinterest',
'videoType',
'home_video',
'home_custom_video',
'homepage_video_max_width',
'homepage_form_style',
'homepage_custom_html',
'home_secondary_background_color',
'home_youtube_background',
'home_buttonRedirect',
'home_buttonRedirect_1',
'homepage_form_style_max_width',
'homepage_email_collector',
'homepage_conv_code',
'activeReplyMessageHomepage',
'reply_subject_message_homepage',
'reply_message_homepage',
'activeHomepageCustomForm',
'HomepageCustomFormButtonText',
'HomepageCustomFormData'
];
return BuildJsonStringWizard(more_settings_arr);
}
return that;
}();
/**
* RecommendedImagesPagInation Class
*/
var RecommendedImagesPagInation = new function() {
var that = this;
/**
* Recommended Images PagInation Initialize
*/
that.init = function( settings ) {
if ( !settings ) return;
that.isMobile = settings.isMobile;
that.$recommendedImagesContainer = settings.$recommendedImagesContainer;
that.$recommendedImages = settings.$recommendedImages;
that.recommendedImagesPage = settings.recommendedImagesPage;
if ( !that.$loading ) {
that.$loading = $('<div class="RecommendedImagesLoading text-center" style="width: 100%;"><i class="ace-icon fa fa-spinner fa-spin fa-2x"></i></div>');
}
that.$recommendedImagesContainer.append(that.$loading);
if ( that.isMobile ) {
if ( $('#loadMore').length !== 0 ) $('#loadMore').remove();
that.$loadMore = $('<div class="text-center"><a id="loadMore" class="btn btn-primary">'+translations.loadmore+'</a></div>');
that.$recommendedImagesContainer.append(that.$loadMore);
}
that.addLoadNextPageAbility();
};
/**
* The method is loading the next page images
*/
that.addLoadNextPageAbility = function() {
if ( that.$loadMore ) {
that.$loadMore.on('click', function() {
that.getNextPage();
});
} else {
that.$recommendedImagesContainer.scroll( function( e ) {
var $this = $(this);
var st = $this.scrollTop();
if ( st > ( (that.$recommendedImagesContainer[0].scrollHeight - that.$recommendedImagesContainer[0].offsetHeight) * 0.80 ) ) {
that.getNextPage();
}
});
}
};
/**
* The method is fetching the next page of the recommended images
*/
that.getNextPage = function() {
if ( recommendedImagesLoading_start == false ) {
that.recommendedImagesPage++;
Wizard.homePageBgOptions.getRecommendedImages(that.recommendedImagesPage);
}
};
/**
* The method is removing the class objects
*/
that.destroy = function() {
if ( that.$loadMore ) {
that.$loadMore.remove();
}
};
return that;
}();
jQuery(function($) {
GetImageAttributes();
FitWizardTextToBox();
$('.checkboxSingleSettingNew .title.closeOption').on('click',function() {
var $this = $(this);
var $checkboxSingleSettingNew = $this.parent('.checkboxSingleSettingNew');
var $content = $checkboxSingleSettingNew.find('.content');
if ($content.hasClass('closeTab')) {
$content.removeClass('closeTab').addClass('openTab');
} else {
$content.removeClass('openTab').addClass('closeTab');
}
$checkboxSingleSettingNew.siblings().find('.content').removeClass('openTab').addClass('closeTab');
});
$('.spectrumField').on('change',function() {
var $input = $(this);
var color = $input.val();
$input.spectrum("set",color);
});
$('#backgroundTypeSelect').click(function() {
if ($('#backgroundTypeSelectBOX').is(":visible")) {
$('#backgroundTypeSelectBOX').fadeOut();
} else {
$('#backgroundTypeSelectBOX').fadeIn();
}
});
existingTitle1 = $('#home_siteSlogan').val();
existingTitle2 = $('#home_siteSlogan_2').val();
existingTitle3 = $('#home_SecondSiteSlogan').val();
existingHomeButton1 = $('#home_buttonText').val();
existingHomeButton2 = $('#home_buttonText_1').val();
$('#home_siteSlogan, #home_siteSlogan_2, #home_SecondSiteSlogan, #home_buttonText, #home_buttonText_1').on('input',function() {
existingTitle1 = $('#home_siteSlogan').val();
existingTitle2 = $('#home_siteSlogan_2').val();
existingTitle3 = $('#home_SecondSiteSlogan').val();
existingHomeButton1 = $('#home_buttonText').val();
existingHomeButton2 = $('#home_buttonText_1').val();
});
SetHomepageInlineType('onLoad');
SetHomepageInlineType_Build_second_homepage_goal('onLoad');
SetHomepageInlineType_ShowHideAllSettingsBox('onLoad');
SetHomepageInlineType_Build_homepage_goal_place('onLoad');
SetHomepageInlineType_homepage_layout_kind('onLoad');
SetHomepageInlineType_Update_homepage_goal_place('onLoad');
$('#homepage_goal_type').on('change', function(event, flagStatus) {
if ( !flagStatus ) {
holdWizardSave = true;
SetHomepageInlineType('onChange');
holdWizardSave = false;
/* input change was triggered from other set of triggers so we have `flagStatus`
and we don't need to hold wizard because we already doing that in the triggers loop*/
} else {
SetHomepageInlineType(flagStatus);
}
});
$('#homepage_second_goal_type').on('change', function(event, flagStatus) {
if ( !flagStatus ) {
holdWizardSave = true;
SetHomepageInlineType_ShowHideAllSettingsBox('onChange');
holdWizardSave = false;
/* input change was triggered from other set of triggers so we have `flagStatus`
and we don't need to hold wizard because we already doing that in the triggers loop*/
} else {
SetHomepageInlineType_ShowHideAllSettingsBox(flagStatus);
}
});
$('#homepage_layout_kind').on('change', function(event, flagStatus) {
if ( !flagStatus ) {
holdWizardSave = true;
SetHomepageInlineType_homepage_layout_kind('onChange');
holdWizardSave = false;
/* input change was triggered from other set of triggers so we have `flagStatus`
and we don't need to hold wizard because we already doing that in the triggers loop*/
} else {
SetHomepageInlineType_homepage_layout_kind(flagStatus);
}
});
$('#homepage_goal_place').on('change', function(event, flagStatus) {
if ( !flagStatus ) {
holdWizardSave = true;
SetHomepageInlineType_Update_homepage_goal_place('onChange');
holdWizardSave = false;
/* input change was triggered from other set of triggers so we have `flagStatus`
and we don't need to hold wizard because we already doing that in the triggers loop*/
} else {
SetHomepageInlineType_Update_homepage_goal_place(flagStatus);
}
});
$('#homepage_goal_position').on('change', function(event, flagStatus) {
});
$('#homepageShapeDivider').on('change',function() {
var id = $(this).val();
if (id=='') {
id = 1;
}
$('.homepage-shapes-button-container .shapes-design-button').removeClass('active');
$('.homepage-shapes-button-container[data-id="'+id+'"] .shapes-design-button').addClass('active');
});
$('.btnSettings.s123-i-t-text-design').on('click.showFonts', function() {
var $this = $(this);
$($this.data('s-b-id')).find('.chosen-container.chosen-container-single').trigger('mousedown');
/* because we have event lister on the document for closing the settings box */
$($this.data('s-b-id')).find('.chosen-drop').off('mousedown.stop-setting-box-mouse-click').on('mousedown.stop-setting-box-mouse-click','li', function( event ) {
event.stopPropagation();
});
});
window.onbeforeunload = function (e) {
if (disableLeavePopup==false) {
var message = "Do you want to leave the interface?",
e = e || window.event;
if (e) {
e.returnValue = message;
}
return message;
}
};
window.wizardTitleSuffix = document.title.replace($('#name').val(),'');
LayoutPickupManager();
$('#template, #header_opacity, #header_width, #header_style, #header_size, #header_logo_back_color').on('change', function() {
LayoutPickupManager();
});
WebsiteBackgroundImageHandler();
$('#templates_tabs > div').on('click',function() {
var tab = $(this).data('tab');
$('#homepageTemplates .tabContent').removeClass('active');
$('#'+tab).addClass('active');
$('#templates_tabs > div').removeClass('active');
$(this).addClass('active');
});
$('#alreadyHaveDomain .old').on('click',function() {
if ($('#newDomain').is(":visible")) {
$('#newDomain').fadeOut(100,function() {
$('#existingDomain').fadeIn();
});
$('#alreadyHaveDomain .old').hide();
$('#alreadyHaveDomain .new').show();
}
});
$('#alreadyHaveDomain .new').on('click',function() {
if (!$('#newDomain').is(":visible")) {
$('#existingDomain').fadeOut(100,function() {
$('#newDomain').fadeIn();
});
$('#alreadyHaveDomain .new').hide();
$('#alreadyHaveDomain .old').show();
}
});
$('#home_third_background_color').on('change', function() {
var backColor = $(this).val();
var bestTextColorFit = invertColor(backColor,true);
$('#home_text_color').val(bestTextColorFit);
});
$('.wizard-accordion').on('show.bs.collapse', function () {
$(this).scrollParent().scrollTop(0);
});
/**
* Add the preview IFrame load event.
* Note: On some cases the preview IFrame loaded before the wizard
* get to the area it add the IFrame `load` event. In those cases
* the Load event is not trigged because the IFrame already loaded.
* To fix it we first add the load event then set the IFrame URL.
*/
$('#websitePreviewIframe').load(function() {
$(this).data('reload-process',false);
PreviewExternalLinksHandler();
Wizard.Preview.init();
scrollToPointInPreview();
if ( $('#previewButtons').data('active-btn') === 'mobile'
|| $('#previewButtons').data('active-btn') == 'tablet' ) {
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.Parallax_active(false);
}
}
})
.attr('src','/?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
$("select[data-expandto]").focus(function(){
$(this).attr("size",$(this).data("expandto"));
var x = "select[tabindex='" + (parseInt($(this).attr('tabindex'),10) + 1) + "']";
$(x).fadeTo(50,0);
});
$("select[data-expandto]").blur(function(){
$(this).attr("size",1);
var x = "select[tabindex='" + (parseInt($(this).attr('tabindex'),10) + 1) + "']";
$(x).fadeTo('fast',1.0);
});
$('#global_main_color').on('change',function(){
$('#menu_text_hover_color').val($('#global_main_color').val()).trigger('change');
});
PrintTextLayouts();
StylesLayoutsPagInation.init({
isMobile: $('html').data('device') !='computer',
$container: $('.chooseUniqueStyle'),
page: 1
});
/**
* Homepage Action Buttons Ready Template Change Handler - When changing ready template we need also to update the
* homepage goal button icons.
*/
$('#home_buttonText_icon, #home_buttonText_1_icon').on('change',function( event, flagStatus ) {
if ( flagStatus != 'ReadyTemplateChange' ) return;
var id = $(this).attr('id');
var icon = $(this).val();
if ( icon.length > 0 ) {
UpdateImagePreview(id, { icon: icon });
} else {
topWindow.uploadFiles[id].btns.remove.trigger('click');
}
});
$('#home_video_background, #home_custom_image').on('change',function() {
var id = $(this).attr('id');
var uploadFile = topWindow.uploadFiles[id];
if ( id != 'home_video_background' ) {
var image = $('#'+id+'').val();
var tiny_image = image.replace("normal_", "100_");
if ( image.indexOf('unsplash.com') !== -1 ) {
tiny_image = image.replace("&w=2500", "&w=100");
}
UpdateImagePreview(id, { normal: image, tiny: tiny_image });
}
UploadLibraryImageToUserWebsite(id);
});
ShowIconStyle();
$('#siteLogo').on('change',function() {
ShowIconStyle();
var size = 80;
$('#logo_img_size_slider').slider('value',size);
$('#logo_img_size_view').html(size);
$('#logo_img_size').val(size);
});
/**
* Site Logo Style Handler - In some styles the logo don't have text so we need to hide
* the settings icons that are related to the text because they are irrelevant and on the o posit
* we need to show them if the logo style have text.
*/
logoFontStyleHandler();
/**
* Homepage Fonts Weight Handler - Initialize the click event of homepage fonts weight icon
*/
homepageFontsWeightHandler();
/**
* Homepage Fonts Italic Handler - Initialize the click event of homepage fonts italic icon
*/
homepageFontsItalicHandler();
$('#homepageTextAdv1btn,#homepageTextAdv2btn,#homepageTextAdv3btn').click(function() {
$('#homepageTextAdv1').fadeToggle();
$('#homepageTextAdv2').fadeToggle();
$('#homepageTextAdv3').fadeToggle();
});
$('#WebsiteThemeAdvancedOptions').click(function() {
if ( !$('#WebsiteThemeAdvancedOptionsBOX').is(':visible') ) {
$('#WebsiteThemeAdvancedOptions').html(translations.BackToReadyStructure);
$('#WebsiteColorsManage').hide();
$('#WebsiteThemeAdvancedOptionsBOX').fadeIn();
} else {
$('#WebsiteThemeAdvancedOptions').html(translations.AdvancedOptions);
$('#WebsiteColorsManage').fadeIn();
$('#WebsiteThemeAdvancedOptionsBOX').hide();
}
});
/*
$('.tab-content').perfectScrollbar({
wheelSpeed: 0.5,
wheelPropagation: true,
maxScrollbarLength: 100,
suppressScrollX: true
});
*/
$('.tab-content').addClass('fancy-scrollbar');
$('.style_color_pel_row').click(function() {
$('#theme_style').val($(this).data('style').toLowerCase());
themeStyleChange();
$('#theme_style').trigger('change');
});
$('#theme_style').on('change',function() {
themeStyleChange_preview();
});
ActiveDisableInsideAdsManager();
$('#ad_manger_active').on('change',function() {
ActiveDisableInsideAdsManager();
if ($('#ad_manger_active').is(":checked")==true) {
$('#adManagerInsideLevel').show();
} else {
$('#adManagerInsideLevel').hide();
}
});
$('#wizardTab8button').on('click',function() {
CheckIfTheUserHaveAdsPromoOnHomepageModules();
});
SetHomepageGoal();
autosize($('textarea[class*=autosize]'));
if (newUser==true) {
if ($('html').data('device') === 'computer') {
if (abTest_v1!='noHomepageTabNoTour' && abTest_v1!='noHomepageTab-NoDomainTab-NoTour') {
$('#congratulationModal').modal('show');
}
}
mixPanelEvent(false,"User create website");
if (window.fbq && fbq && numberOfWebsitesForUser=='1') {
fbq('track', 'Lead');
}
window.history.pushState("object or string", "Title", window.location.href.replace("&new=1", ""));
}
$('#all_fonts').change(function(){
fontsGlobalChange();
});
$('#customTemplate').change(function(){
SetLayout($('#customTemplate').val(),0);
});
ShowOrHideCustomFontsSelect();
Library.init({
translations: {
imageLibrary: translations.library_imageLibrary,
close: translations.library_close
}});
$('#popUpPreview').on('show.bs.modal', function (event) {
var modal = $(this);
modal.find('.modal-body').html('<div style="width:100%;height:80vh;-webkit-overflow-scrolling:touch;overflow:auto;"><iframe id="popUpPreviewIframe" src="/?w='+websiteID+'&disableCache='+getRandomInt(0,9999999)+'" style="width:100%;height:80vh;margin:0;padding:0;border:none;"></iframe></div>');
});
$('#videoLibrary').on('show.bs.modal', function (event) {
var modal = $(this);
var liveUpdate = $('#videoLibrary').data('liveUpdate');
if (modal.find('.modal-body').html()=='') {
modal.find('.modal-body').html('<iframe id="videoLibraryModal" class="libraryIframe" src="/versions/'+versionNUM+'/wizard/imagesLibrary/pixabay_video.php?w='+websiteID+'&liveUpdate='+liveUpdate+'&orientation=horizontal&min_width=1200&min_height=500" style="width:100%;height:500px;margin:0;padding:0;border:none;"></iframe>');
}
});
$('#upgradePackage').on('show.bs.modal', function (event) {
$('body').addClass('blurBackground');
mixPanelEvent(false,"User click upgrade button in wizard");
});
$('#upgradePackage').on('hide.bs.modal', function (event) {
$('body').removeClass('blurBackground');
});
$('#publishModal').on('show.bs.modal', function (event) {
$('body').addClass('blurBackground');
});
$('#publishModal').on('hide.bs.modal', function (event) {
$('body').removeClass('blurBackground');
});
$('#imageIcons').on('show.bs.modal', function (event) {
var modal = $(this);
var src = '/versions/'+versionNUM+'/wizard/imageIcons/index.php?w=' + websiteID;
if ( modal.data('uploadFileInputId') === 'siteLogo' ) src += '&hideTrademark=1';
modal.find('.modal-body').html('<iframe id="imageIconsModal" src="' + src + '" style="width:100%;height:500px;margin:0;padding:0;border:none;"></iframe>');
});
$('#congratulationModal').on('shown.bs.modal', function (event) {
if (abTest_v1=='tour2') {
$('#congratulationModal').find('.imgVideo .media').click(function() {
var $this = $(this);
ShowTourWelcomeVideoExplain($this.data('title'),$this.data('video'),$this.data('image-preview'),'');
});
}
});
$('#congratulationModal').on('hide.bs.modal', function (event) {
if (abTest_v1=='tour2' || abTest_v1=='noHomepageTabNoTour' || abTest_v1=='noHomepageTab-NoDomainTab-NoTour') {
} else {
wizardTour();
}
});
$('#moduleWindow').on('hide.bs.modal', function (event) {
if ( event.target.id!='moduleWindow' && !$(document.activeElement).hasClass('close') ) {
if ( $('#moduleItemsIframe').contents().find('.SubmitButtonsArea').length === 0 ) {
return true;
} else {
return false;
}
}
});
LoadModulesLists();
$("#wizardForm").submit(function(e) {
SaveWizard();
e.preventDefault(); // avoid to execute the actual submit of the form.
});
var tid = setInterval(AutoSaveInerval, 2000);
$(".inputChangeOnlySave").on('input', function() {
WizardUndoRedoHandler.buttonsDisable();
if ( holdWizardSave ) return;
clearTimeout(this.finishedTyping);
this.finishedTyping = setTimeout( function() {
AutoSaveWizard(false,true);
},doneTypingInterval);
});
$(".inputChangeReload").on('change', function(event, flagStatus) {
if ( holdWizardSave ) return; //Can be remove soon
if ( this.id === 'language' ) {
window.reloadWizardAfterSave = true;
window.reloadWizardAfterSaveMessage = translations.wizardLanguageReload;
}
window.scrollPreview = $(this).data('scroll-preview');
AutoSaveWizard(true,true);
});
$('input:not([type="checkbox"]):not([type="radio"]).inputChangeReload').on('input', function() {
WizardUndoRedoHandler.buttonsDisable();
ChangePreviewLive(this);
if ( holdWizardSave ) return;
clearTimeout(typingTimer);
typingTimer = setTimeout(doneTyping, doneTypingInterval);
});
/**
* At this moment there is duplicate event on inputs, when the
* user type the `input` event is trigger and when he focus out
* also the change event is triggered. To fix it we need to do:
* `$(".inputChangeLive:not(input):not(textarea)").change`
* But if we like to do it we need to replace all the manually
* inputs `change` event triggers to manually `input` event trigger.
* e.g. The homepage background image filter will stop works on
* click if we will make the change.
*/
$('.inputChangeLive').on('change', function(event, flagStatus) {
ChangePreviewLive(this);
if ( holdWizardSave ) return; //Can be remove soon
window.scrollPreview = $(this).data('scroll-preview');
isWizardChange = true;
isPreviewReload = false;
});
$(".inputChangeLive").on('change', function(event, flagStatus) {
ChangePreviewLive(this);
if ( holdWizardSave ) return; //Can be remove soon
window.scrollPreview = $(this).data('scroll-preview');
isWizardChange = true;
isPreviewReload = false;
});
/**
* Add typing timer to inputs because we want manually to control when to save and not with the
* auto wizard saving that is called from the timer that is saving the wizard automatically every 2 seconds
*/
$("input.inputChangeLive,textarea.inputChangeLive").on('input', function( event ) {
WizardUndoRedoHandler.buttonsDisable();
ChangePreviewLive(this);
if ( holdWizardSave ) return;
clearTimeout(window.inputChangeLive_finishedTyping);
window.inputChangeLive_finishedTyping = setTimeout( function() {
window.scrollPreview = $(this).data('scroll-preview');
AutoSaveWizard(false,true);
},doneTypingInterval);
});
$(".inputReloadPreviewCSS").on('change', function(event, flagStatus) {
if ( holdWizardSave ) return; //Can be remove soon
window.reloadPreviewCSS = ReloadPreviewCSS;
AutoSaveWizard(false,true);
});
$("input.inputReloadPreviewCSS").on('input', function( event ) {
WizardUndoRedoHandler.buttonsDisable();
if ( holdWizardSave ) return;
window.reloadPreviewCSS = ReloadPreviewCSS;
AutoSaveWizard(false,true);
});
$("[data-update-preview-area]").on('change', function(event, flagStatus) {
var $this = $(this);
if ( holdWizardSave ) return; //Can be remove soon
window.scrollPreview = $this.data('scroll-preview'); scrollToPointInPreview();
$("#wizardForm").off('ajaxSuccess').one( 'ajaxSuccess', function( event ) {
if ( $this.data('update-preview-homepage-redirect') && !IsPreviewAtHomepage() ) {
isPreviewReload = true;
RefreshPreview();
/* if the user has changed a ready template there will be a loading
icon so we need to remove it after the loading has finished */
if ( $('.chooseUniqueStyle').data('template-change-in-progress') ) {
$('.chooseUniqueStyle').trigger('style_change',false);
}
} else {
UpdatePreviewAreaByAjax($this.data('update-preview-area'));
}
});
WizardUndoRedoHandler.buttonsDisable();
AutoSaveWizard(false,true);
});
$(".formatOptionsHelpLink").click(function() {
$('#advancedFormatOptions').modal('show');
});
$("#publishWebsiteButton").on(ace.click_event, function() {
if (wizardReadyToGo==false) {
WizardLoadError();
return false;
}
var isFormValid = CheckIfFormValid();
$(".SubmitButtonsArea").find('[data-rel=tooltip-desk]').tooltip('hide');
/**
* Fired when the popover has been made visible to the user. Bootstrap
* Confirmation `popout` property do not works good, its suppose to
* prevent from the Confirmation to be closed when the user click inside
* the box, but its closing it. So we fix it manually.
*/
$(".SubmitButtonsArea").one('shown.bs.confirmation', function () {
$('.popover.confirmation.in').off('click').click(function(event) {
event.preventDefault();
event.stopPropagation();
});
});
/**
* Bootstrap Confirmation
* Documentation : https://ethaizone.github.io/Bootstrap-Confirmation/
*/
$(".SubmitButtonsArea").confirmation({
placement: $('html').data('device') !== 'computer' ? 'top' : intrface_align_reverse,
title: translations.publishSure,
btnOkLabel: '<i class="icon-ok-sign icon-white"></i> '+translations.yes+'',
btnCancelLabel: '<i class="icon-remove-sign"></i> '+translations.no+'',
popout: true,
singleton: true,
container: 'body',
btnOkClass: 'btn-success btn-sm spacing-confirmation-btn',
btnCancelClass: 'btn-default btn-sm spacing-confirmation-btn',
onConfirm: function(result) {
SaveWizard();
if( isWizardChange == false ) {
$('#publishModal').find('.modal-title').html(escapeHtml(translations.Publishing));
$('#publishLoadingMessage').show();
$('#publishFinishLoadingMessage').hide();
$('#publishModal').modal('show');
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/publish.php",
data: 'w='+$('#id').val()+'&id='+$('#id').val()+'&theme='+$('#enable_as_theme').val()+'&language='+$('#language').val()+'',
success: function(data) {
if ( data == 'Admin User') {
$('#publishModal').modal('hide');
bootbox.alert({
title: '<span class="text-danger"><b>Admin user can not update user website. Sorry :)</b></span>',
message: 'Admin user can not update user website. Sorry :)'
});
return;
}
var json = $.parseJSON(data);
subDomainFreeAsDomain   = json.subDomainFreeAsDomain;
websitePassword         = json.websitePassword;
websiteDomain           = json.websiteDomain;
$('#publishModal_url').html(websiteDomain);
$('#publishQRcode').html('<img src="https://chart.apis.google.com/chart?cht=qr&chs=100x100&chl='+decodeURIComponent(websiteDomain)+'&chld=H|0">');
$('#publishModal_url').attr('href','http://'+websiteDomain);
$('#publishModal_url_facebook').attr('href','https://www.facebook.com/sharer/sharer.php?u=http://'+websiteDomain+'');
$('#publishModal_url_twitter').attr('href','https://twitter.com/home?status=http://'+websiteDomain+'');
if (websitePassword != '') {
$('#publishModal_passwordScreen').show();
$('#publishModal_password').html(websitePassword);
} else {
$('#publishModal_passwordScreen').hide();
}
$('#publishModal_recommendedDomainScreen').hide();
$('#publishModal_checkDomainAvailability').hide();
if (packageNUM=='1') {
if (subDomainFreeAsDomain!='0' && subDomainFreeAsDomain!='NULL' && subDomainFreeAsDomain!='') {
$('#publishModal_recommendedDomain').html('www.'+subDomainFreeAsDomain+'');
$('#publishModal_recommendedDomainScreen').show();
}
$('#publishModal_checkDomainAvailability').show();
$('#showSearchDomainIframe').html('<div id="SetDomainQuickSearchWidget_gg03h12g3f2_publish" class="SetDomainQuickSearchWidget" data-publish="1" data-website-id="'+websiteID+'"></div>');
SearchDomain.init();
}
$('#publishModal').find('.modal-title').html(escapeHtml(translations.PublishedDone));
$('#publishLoadingMessage').hide();
$('#publishFinishLoadingMessage').slideDown(200);
$('#wesiteNameChange').val('');
AfterPublishReinitialize();
SendScanSitemapRequest();
}
});
}
}
});
});
$("#previewButtons").on(ace.click_event, function() {
if (wizardReadyToGo==false) {
WizardLoadError();
return false;
}
var isFormValid = CheckIfFormValid();
$("#previewButtons").tooltip('hide');
/**
* Fired when the popover has been made visible to the user. Bootstrap
* Confirmation `popout` property do not works good, its suppose to
* prevent from the Confirmation to be closed when the user click inside
* the box, but its closing it. So we fix it manually.
*/
$("#previewButtons").one('shown.bs.confirmation', function () {
$('.popover.confirmation.in').off('click').click(function(event) {
event.preventDefault();
event.stopPropagation();
});
});
if ( $('.previewDevices.popover').is(':visible') ) {
hidePopover();
return;
}
$("#previewButtons").popover({
container: 'body',
content: $('#previewScaleDevices'),
html: true,
trigger: 'manual',
template: '<div class="popover previewDevices" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
placement: ace.vars['touch'] ? 'auto' : intrface_align_reverse
});
$("#previewButtons").popover('show');
$('#previewButtons').on('shown.bs.popover', function () {
setTimeout(function() {
var prevActive = $('#previewButtons').attr('data-prev-active');
if (typeof prevActive !== typeof undefined && prevActive !== false) {
$('.previewDevices .devicesPreviewContent li').removeClass('active');
$('.previewDevices .devicesPreviewContent li[data-device-width='+$('#previewButtons').attr('data-prev-active')+']').addClass('active');
} else {
$('.previewDevices .devicesPreviewContent li[data-device-width=1280]').addClass('active');
}
},100);
});
$('#previewButtons').on('shown.bs.popover', function () {
$(document).on('mousedown.previewButtonDestroyPopover', function ( event ) {
if ( $(event.target).closest('#previewButtons').length > 0 ) return;
if ( $(event.target).closest('.popover.previewDevices').length === 0 ) {
hidePopover();
}
});
$(window).one('blur.previewButtonDestroyPopover', function( event ) {
hidePopover();
});
});
/**
* The function destroy the Popover and removes event handlers that were attached to it
*/
function hidePopover() {
$('#previewButtons').popover('hide');
$(document).off('mousedown.previewButtonDestroyPopover');
$(window).off('blur.previewButtonDestroyPopover');
}
});
$(document).on('click', '.bootbox', function(event) {
var target = event.target;
while(target !== this){
target = target.parentNode;
if(target.className.indexOf('modal-dialog') !== -1){
return;
}
}
bootbox.hideAll();
});
mixPanelEvent(false,"Enter wizard");
$('#closeWizardSmallIcon').click(function() {
$('.tab-pane').hide();
$('.wizardSideTabs > li.active').removeClass('active');
website_desktop_view();
});
/**
* jQuery NestedSortable Plugin Initial
* Documentation : https://github.com/ilikenwf/nestedSortable
*/
$('#sortable').nestedSortable({
listType: 'ul',         // Require for Nested plugin
items: 'li',            // Require for Nested plugin
maxLevels: 2,           // Require for Nested plugin
delay: 100,             // Time in milliseconds to define when the sorting should start
forcePlaceholderSize: true,
opacity: .6,
revert: 250,
tabSize: 1,             // How far right/left the item has to travel in order to be nested
isTree: true,           // If we set it to `false` its very hard to position elements
rtl: ($('html[dir=rtl]').length !== 0 ? true : false),  // For change drag directions when dragging into a category
expandOnHover: 700,
startCollapsed: false,
toleranceElement: '> div',
tolerance: 'pointer',
cancel: ace.vars['touch'] ? false : '.btn-group, .smallManageIcons',
handle: ace.vars['touch'] ? '.draggingModuleButton' : false,
cursor: "move",
/**
* We added padding to `#pagesTab` and using his parent for prevent an issue
* of dragging an element to the bottom as last item, the `containment`
* property prevent as from doing it if we use `#pagesTab`.
*/
containment: $('#pagesTab').parent(),
appendTo: "#pagesTab",
helper: 'clone',
/**
* I did not found any property to prevent user from dragging a category into
* another category on Nested plugin, so I used `isAllowed` to handle this issue.
*/
isAllowed : function(placeholder, placeholderParent, currentItem) {
if ( !placeholderParent ) return true;
var isAllowed = modulesArr[Number(currentItem.data('moduletypenum'))]['module_kind'] != '3' && currentItem.data('moduletypenum') != 112;
if ( isAllowed ) {
isAllowed = currentItem.data('moduletypenum') != '78';
}
/**
* We set the `isAllow` mode to show a message to the user when he
* is not allow to drop a page, e.g. Promo can not be a child module.
* We didn't use `.mjs-nestedSortable-error` because `nestedSortable`
* add it sometimes when the error is not related to the place.
*/
placeholder.attr('data-ns-is-allowed',isAllowed);
return isAllowed;
},
update: function(event, ui) {
SerializeModulesParentId();
BuildToolJSON();
var module = {
mp_showInHome: GetModuleSetting(ui.item.data('moduleid'),'mp_showInHome'),
id: ui.item.data('moduleid')
};
if ( IsSinglePage()
|| (IsPreviewAtHomepage() && (module.mp_showInHome == '1' || ui.item.data('moduletypenum') == '78'))
|| ui.item.data('moduletypenum') == '108' ) {
SortPreviewModules(true);
window.scrollPreview = '#section-' + module.id;
scrollToPointInPreview();
AutoSaveWizard(false,true);
} else {
if ( module.mp_showInHome == '1' ) {
window.scrollPreview = '#section-' + module.id;
}
AutoSaveWizard(true,true);
}
},
start: function( event, ui ) {
ui.placeholder.html('<div class="alert alert-danger">'+escapeHtml(translations.pagesDragToCatError)+'</div>');
}
});
/**
* jQuery Validation Plugin Initial
* Documentation : http://jqueryvalidation.org/documentation/
*/
$('#wizardForm').validate({
errorElement: 'div',
errorClass: 'help-block',
focusInvalid: true,
ignore: '.ignore',
highlight: function (e) {
$(e).closest('.form-group').removeClass('has-info').addClass('has-error');
},
success: function (e) {
$(e).closest('.form-group').removeClass('has-error');
$(e).remove();
},
errorPlacement: function (error, element) {
if( element.is('input[type=checkbox]') || element.is('input[type=radio]') ) {
var controls = element.closest('div[class*="col-"]');
if( controls.find(':checkbox,:radio').length > 1 ) controls.append(error);
else error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
}
else if( element.is('.select2') ) {
error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
}
else if( element.is('.chosen-select') ) {
error.insertAfter(element.siblings('[class*="chosen-container"]:eq(0)'));
}
else {
error.appendTo(element.closest('.form-group'));
}
}
});
ShowEditButtonsOnActive();
$('[data-toggle=mytabs]').click(function ( event ) {
event.preventDefault();
event.stopPropagation();
var $this = $(this);
var isFormValid = CheckIfFormValid();
var tabID = $this.data('tab-id');
OpenWizardTab(tabID,false);
$this.trigger('wizard.tab.click');
});
(function () {
var $box = $('#all_style_pelletes');
var $btns = $('.changePelleteColors');
$btns.click(function() {
if ( $btns.data('sb-status') === 'open' ) {
hide();
return;
}
$(document).on('mousedown.colorPalette', function ( event ) {
var $target = $(event.target);
if ( $target.closest($box).length !== 0 ) return;
if ( $target.closest($btns).length !== 0 ) return;
hide();
});
$(window).one('blur.colorPalette', function( event ) {
hide();
});
$btns.data('sb-status','open');
$box.fadeIn();
});
/**
* The function hide box.
*/
function hide() {
$(document).off('mousedown.colorPalette');
$(window).off('blur.colorPalette');
$box.fadeOut();
$('.color-palette-backdrop').remove();
$btns.data('sb-status','close');
}
})();
$('.premiumFeatureMessage').click(function() {
upgradeFeaturesManager.show($(this).data('u-f-m-id'));
});
$('.premiumFeatureMessageItem').click(function() {
event.preventDefault();
event.stopPropagation();
upgradeFeaturesManager.show($(this).data('u-f-m-id'));
});
$('#analytics_code,#google_webmaster_tool_code,#bing_webmaster_tool_code,#yandex_webmaster_tool_code,#google_remarketing_tag,#facebook_pixel_code').on('input', function() {
$this = $(this);
$this.trigger('change');
if ($('#analytics_code').val()=='' && $('#google_webmaster_tool_code').val()=='' && $('#bing_webmaster_tool_code').val()=='' && $('#yandex_webmaster_tool_code').val()=='' && $('#google_remarketing_tag').val()=='' && $('#facebook_pixel_code').val()=='') {
$('#managePluginButtons').show();
} else {
$('#managePluginButtons').hide();
}
});
$('#pluginsModal').on('show.bs.modal', function (event) {
var modal = $(this);
if ( $(event.relatedTarget).data('plugin-id') ) {
modal.find('.modal-body').html('<iframe id="pluginsIframe" name="pluginsIframe" src="/versions/'+versionNUM+'/wizard/plugins/edit.php?w='+websiteID+'&id='+$(event.relatedTarget).data('plugin-id')+'" class="modal-xlg-height" style="width:100%;margin:0;padding:0;border:none;"></iframe>');
} else {
modal.find('.modal-body').html('<iframe id="pluginsIframe" name="pluginsIframe" src="/versions/'+versionNUM+'/wizard/plugins/index.php?w='+websiteID+'" class="modal-xlg-height" style="width:100%;margin:0;padding:0;border:none;"></iframe>');
}
});
$('#pluginsModal').on('hide.bs.modal', function (event) {
var modal = $(this);
/**
* Remove the HTML from the 'modal-body' div on close `PluginsModal` pop-up modal.
* I added this for stopping the YouTube video because YouTube movie still running
* in the background when we hiding the modal.
*/
modal.find('.modal-body').empty();
AutoSaveWizard(true,true);
});
$('#globalModal').on('show.bs.modal', function (event) {
var $modal = $(this);
var $relatedTarget = $(event.relatedTarget);
var modalID             = $modal.attr('id');
var customZindex        = $relatedTarget.data('zindex');
var customSize          = $relatedTarget.data('size');
var customBeforerun     = $relatedTarget.data('beforerun');
var customAfterhide     = $relatedTarget.data('afterhide');
if (typeof customZindex !== "undefined" && customZindex=='high') {
$modal.css('z-index',999999);
$('#'+modalID+'_backdrop').css('z-index',999990);
} else {
$modal.css('z-index',1050);
$('#'+modalID+'_backdrop').css('z-index',1040);
}
if (customSize=='small') {
$modal.find('.modal-dialog').css('width','600px');
} else {
$modal.find('.modal-dialog').css('width','90%');
}
if (typeof customBeforerun !== "undefined" && customBeforerun!='') {
window[customBeforerun]();
}
if (typeof customAfterhide !== "undefined" && customAfterhide!='') {
$modal.data('afterhide',customAfterhide);
} else {
$modal.removeData('afterhide');
}
/**
* Check from where to take the URL and the title. If we want to
* open this modal from iFrame we can set `data-manual-url` and
* `data-manual-title` to load the correct URL and title.
*/
if ( $modal.data('manual') ) {
var url = $modal.data('manual-url');
var title = $modal.data('manual-title');
$modal.data('manual',false);
} else {
var url = $relatedTarget.data('url');
var title = escapeHtml($relatedTarget.data('title'));
}
$modal.find('.modal-title').html(title);
var heighestHeightNUM = $(window).outerHeight(true)-170;
$modal.find('.modal-body').html('<iframe id="globalModalIframe" src="' + url + '" style="width: 100%;height: '+heighestHeightNUM+'px;margin: 0;padding: 0;border: none;"></iframe>');
});
$('#globalModal').on('hide.bs.modal', function (event) {
var $modal = $(this);
var modalID             = $modal.attr('id');
var customAfterhide     = $modal.data('afterhide');
if (typeof customAfterhide !== "undefined" && customAfterhide!='') {
window[customAfterhide]();
}
$modal.find('.modal-body').empty();
AutoSaveWizard(true,true);
});
$('#homepageSeoSettings').on('show.bs.modal', function (event) {
var $modal = $(this);
var $relatedTarget = $(event.relatedTarget);
var url = $relatedTarget.data('url');
var title = escapeHtml($relatedTarget.data('title'));
$modal.find('.modal-title').html(title);
$modal.find('.modal-body').html('<iframe id="homepageSeoSettingsIframe" src="' + url + '" style="width: 100%;height:500px;margin: 0;padding: 0;border: none;"></iframe>');
});
$('#homepageSeoSettings').on('hide.bs.modal', function (event) {
$(this).find('.modal-body').empty();
});
ManageLanguageButtonActiveEvent();
LoadModuleFunctions();
MakeSureWizardReadyToGo();
AddKeyboardShortcuts();
$('.buttonSettingBox').each(function (index, value) {
var $buttonSettingBox = $(this);
var $typeInputField = $buttonSettingBox.find('.typeInputField');
$typeInputField.change(function() {
buttonSettingBoxChange($buttonSettingBox,$(this));
});
buttonSettingBoxChange($buttonSettingBox,$typeInputField);
});
GetActivePlugins();
GetActiveLanguages();
$("#activeReplyMessageHomepage").on('change', function() {
if ( $('#activeReplyMessageHomepage').is(":checked") ) {
$('#reply_subject_message_homepage').closest('.form-group').removeClass('hidden');
$('#reply_message_homepage').closest('.form-group').removeClass('hidden');
} else {
$('#reply_subject_message_homepage').closest('.form-group').addClass('hidden');
$('#reply_message_homepage').closest('.form-group').addClass('hidden');
}
});
$("#reply_message_homepage").change(function() {
AutoSaveWizard(false,true);
});
$("#reply_subject_message_homepage").change(function() {
AutoSaveWizard(false,true);
});
$("#activeReplyMessageHomepage").change(function() {
AutoSaveWizard(false,true);
});
$('#unlockFeature').on('hide.bs.modal', function (event) {
var modal = $(this);
modal.find('.modal-body').empty();
});
$('#languagesManager').on('hide.bs.modal', function (event) {
var $modal = $(this);
if ( !is_unsave_changes($modal,$('#languagesManagerIframe'),event) ) {
GetActiveLanguages();
if (viewButtonReload==false) {
isPreviewReload = true;
RefreshPreview();
} else {
viewButtonReload = false;
}
}
});
$("#homepage_conv_code").change(function() {
AutoSaveWizard(false,true);
});
/**
* Using Tags for Bootstrap Tag Plugin to let the user insert a
* few emails address in email receiver filed (limit to 5 emails).
*
* Bootstrap Tag Plugin Initialize
* Documentation : http://fdeschenes.github.io/bootstrap-tag/
*/
var $emailCollector = $('#homepage_email_collector');
$emailCollector.tag({
placeholder: $emailCollector.attr('placeholder')
});
var $emailInput = $('#wizardForm .tags').find('input:last-child');
$emailInput.addClass('form-control');   // fix design
$emailCollector.on('added', function (e, value) {
var emailObj = $emailCollector.data('tag');
if ( !emailValidator(value) ) {
emailObj.remove(emailObj.inValues(value));
var $error = $('<div class="form-control">'+translations.emailCollectorValidEmail+'</div>').css({
width: '100%',
position: 'absolute',
bottom: '0',
zIndex: '100',
left: '0',
color: 'red',
border: 'none',
});
$emailInput.parent().css({ position: 'relative'}).append($error);
setTimeout( function() {
$error.remove();
}, 1000);
return;
}
if ( $emailCollector.val().split(',').length > 5 ) {
$emailInput.attr('disabled', 'true');
$emailInput.attr('placeholder', translations.emailCollectorRestriction);
emailObj.remove(emailObj.inValues(value));
}
AutoSaveWizard(false,true);
});
$emailCollector.on('removed', function (e, value) {
var emailObj = $emailCollector.data('tag');
if ( $emailCollector.val().split(',').length < 5 ) {
$emailInput.removeAttr('disabled');
$emailInput.attr('placeholder', $emailCollector.attr('placeholder'));
}
AutoSaveWizard(false,true);
});
$('#ad_manger_active').change(function() {
AutoSaveWizard(true,true);
});
$('#ad_manager_code').on('input', function() {
$('.ad_manager_code_warning').removeClass('hidden');
$('#ad_manager_code').off('input');
});
Wizard.init();
Wizard.Notification.init($('.site123-home-button'));
SetVideoType();
/**
* Shopping Cart & Login Icons Handler
*/
(function() {
$('#showHeaderCart').change(function() {
var $input = $(this);
var $showHeaderCartNoShopExp = $('#showHeaderCartNoShopExp');
if ( $input.prop('checked') ) {
var $has_cart_modules = false;
$.each([37,112], function( index , moduleTypeNUM ){
if ( Wizard.Pages.list.filter('[data-moduletypenum="'+moduleTypeNUM+'"]').length > 0 ) {
$has_cart_modules = true;
}
});
if ( !$has_cart_modules ) {
$showHeaderCartNoShopExp.fadeIn(200,function(){
setTimeout(function(){
$showHeaderCartNoShopExp.stop().fadeOut(200);
},20000);
});
}
} else {
$showHeaderCartNoShopExp.stop().fadeOut();
}
});
})();
/**
* Mobile Menu Color Change - When the user is changing the mobile menu color we
* need to show him a message that he is using the same menu on pc version and it will
* be effected there also.
*/
$('#mobileMenuColor').change(function() {
var $input = $('#customTemplate');
var $showMobileMenuColorExp = $('#showMobileMenuColorExp');
var timer = null;
if ( $input.children(':selected').data('header-layout') == 3 ) {
$showMobileMenuColorExp.fadeIn(200,function(){
setTimeout(function(){
$showMobileMenuColorExp.stop().fadeOut(200);
},20000);
});
} else {
$showMobileMenuColorExp.stop().fadeOut();
}
});
$("#activeHomepageCustomForm").on('change', function() {
if ( $(this).is(":checked") && (OpenPremiumFeatures(packageNUM) > 1) ) {
$('#customFormManageButton').show();
} else {
$('#customFormManageButton').hide();
}
});
$('input[name=onepage]').on('change', function() {
if ( IsSinglePage() ) {
$('.one-page-no-popups-box').fadeIn(600);
} else {
$('.one-page-no-popups-box').fadeOut(600);
}
});
EditPage();
WizardMobileHendlar();
$('#wizardTab9button,#domainAccordionLink').click(function() {
if ($('#newDomain').find('.content').html()=='') {
$('#newDomain').find('.content').html('<div id="SetDomainQuickSearchWidget_wizardDomainTab" class="SetDomainQuickSearchWidget" data-wizard="1" data-website-id="'+websiteID+'"></div>');
SearchDomain.init();
}
if ($('#showHideDomainSuggest').length>0 && $('#showHideDomainSuggest').html()=='') {
$.get( '/manager/domain/checkDomainSuggestReturnHTML.php', {
w: websiteID
}).done(function( data ) {
$('#showHideDomainSuggest').html(data);
});
}
});
$('body').on('mousedown keydown touchstart', function(event) {
if (userActive_isActive==false) {
Wizard.Notification.update();
}
userActive_isActive         = true;
clearTimeout(userActive_timeoutTimer);
userActive_timeoutTimer = setTimeout(userActive_ShowTimeOutWarning, userActive_timeoutTime);
});
$('#home_background_color').on('change.reset_gradients',function( event ) {
$('#homepageGradientsColors').val('');
});
$('#homepageGradientsColors').on('change.reset_bg_color',function( event ) {
$('#home_background_color').spectrum("set",'#222');
/* reset the original input to empty so the undo will ignore the homepage background color when the user
is undoing or redoing */
$('#home_background_color').val('');
});
AddModuleWinHandler();
ProFeature_addBlockDiv({
'userID' : user_id,
'packageNUM' : packageNUM,
'toolType' : 'showHeaderSearch',
'$element' : $('#showHeaderSearch').closest('.checkboxSingleSetting')
});
$('#homepageAlternativeName_edit').click(function() {
$('#wizardTab2button').trigger( 'click' );
$(this).tooltip('destroy');
});
$('#homepage_style_tabs').click(function() {
imageHomepageLiveEleID = '';
});
/**
* Upgrade & Discount Delay Handler - We like to show the upgrade & discount
* boxes only after few minutes.
*/
(function () {
var milliseconds = newUser ? 120000 : 2000;
setTimeout(function() {
if ( $('.upgrade-and-discount-button-box').length === 0 ) return;
$('.upgrade-and-discount-button-box').fadeIn(1000, function() {
FitWizardTextToBox();
});
},milliseconds);
})();
/**
* Initialize the undo plugin
*/
WizardUndoRedoHandler.init({
dataBase: websiteID + '_wizard_undo',
$buttonsContainer: $('#wizardForm .wizard-undo-container')
});
WizardAddImagesToHistory.init({
websiteID: websiteID,
$container: $('.lastImages')
});
textareaAutoIncreaseHeight.init();
/**
* Initialize Homepage Slide Show Class
*/
Wizard.homePageChangingImages.init();
/**
* Initialize Homepage Background Options Class
*/
Wizard.homePageBgOptions.init({
$container: $('#backgroundOptionsTab'),
$popUpContainer: $('.tabbable')
});
/**
* Initialize Progressive Web Application Class
*/
Wizard.progressiveWebApp.init({
$container: $('#pwaContainer')
});
$('#siteLogoImageStyleBOX').on('change',function() {
ShowIconStyle();
});
/**
* Ready Templates Change - When the user is changing the ready template
* we are showing a loading icon above the template he selected
*/
$('.chooseUniqueStyle').on('style_change', function( event, showLoading ) {
var $this = $(this);
$('.chooseUniqueStyle').find('.loading-container').remove();
$this.data('template-change-in-progress',false);
if ( showLoading ) {
$this.data('template-change-in-progress',true);
var html = '';
html += '<div class="loading-container">';
html += '<div class="custom-cover"></div>';
html += '<i class="ace-icon fa fa-spinner fa-spin white fa-5x"></i>';
html += '<div>';
$('.chooseUniqueStyle').find('.unique-styles-button-container.active').append(html);
}
});
mixPanelDataTrackInit();
$('#homepageTab').click(function( event ){
window.scrollPreview = '#top-section';
scrollToPointInPreview();
});
showHideTabExplanationVideo();
addShowHideFontFamilySettingBox();
upgradeFeaturesManager.init(ufmSettings);
ProFeature_addLabel({
'websiteID': websiteID,
'packageNUM': packageNUM,
'limitedToPackageNUM' : '1',
'toolType': 'externalLink',
'$element': $('li .Add-External-Link'),
'text': translations.pro
});
});
/**
* The function initialize the mixPanel data track event.
*/
function mixPanelDataTrackInit() {
$('[data-track]').off('click.mixPanelDataTrack').on('click.mixPanelDataTrack',function( event ) {
var $this = $(this);
mixPanelEventV1(false,$this.data('track'),'user_'+user_id);
try {
hj('tagRecording', ['wizard-'+$this.data('track')]);
} catch(err) { }
});
}
function log_home() {
PrintHomepageLayoutLog();
}
function log_text() {
PrintTextLayoutLog();
}
function log_styles() {
PrintStylesLayoutLog();
}
function log_admin() {
console.log('bla bla bla');
}
/**
* The function handle the add new module modal.
*/
function AddModuleWinHandler() {
$('#AddModuleWin').on('show.bs.modal', function ( event ) {
if ( PagesLimitations() ) event.preventDefault();
if (0 && OpenPremiumFeatures(packageNUM)==1) {
if ((abTestTXT=='10pages' && Wizard.Pages.list.length>=10) || (abTestTXT=='7pages' && Wizard.Pages.list.length>=7)) {
event.preventDefault();
if (abTestTXT=='7pages') {
$limited_pages_number = '7';
}
if (abTestTXT=='10pages') {
$limited_pages_number = '10';
}
bootbox.confirm({
title: translations.freePagesLimitHeader.replace('{{limited_pages_number}}',$limited_pages_number),
message: translations.freePagesLimitMessage.replace('{{limited_pages_number}}',$limited_pages_number),
buttons: {
confirm: {
label: translations.freePagesLimitMessage_GO_PREMIUM,
className: 'btn-success'
},
cancel: {
label: translations.freePagesLimitMessage_Not_now,
className: 'btn-link'
}
},
callback: function( result ) {
if (result) {
disableLeavePopup = true;
location.href = '/manager/upgrade/index.php?w='+websiteID+'&r=10pages';
}
}
});
}
}
});
}
/**
* The function limit the number of pages the user can add to his pages.
*/
function PagesLimitations() {
var $limited_pages_number = 200;
if ( Wizard.Pages.list.length > $limited_pages_number ) {
bootbox.alert({
title: translations.pagesLimitHeader,
message: translations.pagesLimitMessage.replace('{{limited_pages_number}}',$limited_pages_number)
});
return true;
}
return false;
}
function userActive_ShowTimeOutWarning() {
userActive_isActive         = false;
}
function userActive_ForceWebsiteNotifications() {
userActive_isActive         = true;
Wizard.Notification.update();
}
function closeChangeSubDomain() {
$('#publishModal').modal('hide');
UpdateSubDomainAndUniqueDomainIndifferentPlaceInInterfaceAfterUpdate();
}
/**
* The function is updating the homepage type when the user make a change or when the wizard is load
*/
function SetHomepageInlineType( flagStatus ) {
if ( $('#homepage_goal_type').val() == 'no' ) {
$('#homepage_goal_positionBOX').hide();
$('#homepage_goal_spaceBOX').hide();
$('#homepage_goal_placeBOX').hide();
$('#homepage_second_goal_typeBOX').hide();
$('#homepage_second_goal_placeBOX').hide();
$('#homepage_second_goal_spaceBOX').hide();
$('#homepage_second_goal_type').val('no');
$('.homepage_goal_type_box').hide();
$('#homepage_goal_type_settings').hide();
} else {
$('#homepage_goal_positionBOX').show();
$('#homepage_goal_placeBOX').show();
$('#homepage_second_goal_typeBOX').show();
$('#homepage_goal_type_settings').show();
SetHomepageInlineType_Build_second_homepage_goal(flagStatus);
SetHomepageInlineType_Build_homepage_goal_place(flagStatus);
}
SetHomepageInlineType_ShowHideAllSettingsBox(flagStatus);
SetHomepageInlineType_homepage_layout_kind(flagStatus);
}
function SetHomepageInlineType_ShowHideAllSettingsBox(flagStatus) {
var homepage_goal_type                = $('#homepage_goal_type').val();
var homepage_goal_type_setting_box    = $('#homepage_goal_type option[value="'+homepage_goal_type+'"]').data('setting-box');
var homepage_goal_type_setting_box_extra    = $('#homepage_goal_type option[value="'+homepage_goal_type+'"]').data('setting-box-extra');
var homepage_second_goal_type         = $('#homepage_second_goal_type').val();
var homepage_second_goal_type_setting_box    = $('#homepage_second_goal_type option[value="'+homepage_second_goal_type+'"]').data('setting-box');
var homepage_second_goal_type_setting_box_extra    = $('#homepage_second_goal_type option[value="'+homepage_second_goal_type+'"]').data('setting-box-extra');
$('.homepage_goal_type_box').hide();
if (homepage_goal_type!='no') {
$('#homepage_goal_type_'+homepage_goal_type).show();
$('#homepage_goal_type_'+homepage_goal_type_setting_box).show();
$('#homepage_goal_type_'+homepage_goal_type_setting_box_extra).show();
$('#homepage_goal_type_'+homepage_second_goal_type).show();
$('#homepage_goal_type_'+homepage_second_goal_type_setting_box).show();
$('#homepage_goal_type_'+homepage_second_goal_type_setting_box_extra).show();
}
if ( homepage_second_goal_type == 'no' ) {
$('#homepage_second_goal_placeBOX').hide();
$('#homepage_second_goal_spaceBOX').hide();
} else {
$('#homepage_second_goal_placeBOX').show();
$('#homepage_second_goal_spaceBOX').show();
if (flagStatus=='onChange') { //Don't use it on user use the ready template so we don't have a conflict
$('#homepage_second_goal_space').val('20').trigger('change');
}
}
SetHomepageInlineType_ShowHideAccordion(homepage_goal_type_setting_box,homepage_goal_type,homepage_second_goal_type_setting_box,homepage_second_goal_type);
}
/**
* The function is updating the homepage goal accordion title and also knows when to hide and show it if both of the
* goals type don't have related tool to show the user
*
* @pararm {string} setting_box - First homepage goal settings box selector
* @pararm {string} goal_type - First homepage goal settings box selector
* @pararm {string} setting_box - Second homepage goal settings box selector
* @pararm {string} goal_type - Second homepage goal settings box selector
*/
function SetHomepageInlineType_ShowHideAccordion( setting_box, goal_type, second_goal_type_setting_box, second_goal_type ) {
var hGoalTitle = '';
var hSecondGoalTitle = '';
var title = Array();
$('#homepageGoal').hide();
$('.chooseUniqueStyle').removeClass('has-homepage-goal');
if ( $('#homepage_goal_type_'+setting_box).length === 0 && $('#homepage_goal_type_'+goal_type).length === 0 && $('#homepage_goal_type_'+second_goal_type_setting_box).length === 0 && $('#homepage_goal_type_'+second_goal_type).length === 0  ) {
return;
}
$('#homepageGoal').fadeIn(function() {
ShowNewAccordiongInHomepageTab('homepageGoal');
$('.chooseUniqueStyle').addClass('has-homepage-goal');
});
if ( $('#homepage_goal_type_'+setting_box).length > 0 || $('#homepage_goal_type_'+goal_type).length > 0 ) {
hGoalTitle = $('#homepage_goal_type option:selected').text();
if ( hGoalTitle && hGoalTitle.length > 0 ) title.push(hGoalTitle);
}
if ( $('#homepage_goal_type_'+second_goal_type_setting_box).length > 0 || $('#homepage_goal_type_'+second_goal_type).length > 0  ) {
hSecondGoalTitle = $('#homepage_second_goal_type option:selected').text();
if ( hSecondGoalTitle && hSecondGoalTitle.length > 0 ) title.push(hSecondGoalTitle);
}
$('#homepageGoal .panel-title > a').text(title.join(' + '));
}
function SetHomepageInlineType_homepage_layout_kind(flagStatus) {
switch($('#homepage_layout_kind').val()) {
case '1': //Simple - full screen and full screen with side by side elements
$('#layout_homepage_full_widthBOX').show();
$('#homepage_goal_type').find('option[data-side-by-side-disable="1"]').show();
if ($('#homepage_goal_type').val()=='no' || $('#homepage_goal_place').val()=='top' || $('#homepage_goal_place').val()=='bottom') {
$('#layout_left_side_widthBOX').hide();
$('#layout_bottom_spacingBOX').show();
if (flagStatus=='onChange') { //Don't use it on user use the ready template so we don't have a conflict
$('#layout_text_position').val('center_center').trigger('change');
$('#layout_text_align').val('center').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
}
} else {
$('#layout_left_side_widthBOX').show();
$('#layout_bottom_spacingBOX').show();
$('#homepage_goal_type').find('option[data-side-by-side-disable="1"]').hide();
if (flagStatus=='onChange') { //Don't use it on user use the ready template so we don't have a conflict
$('#layout_homepage_full_width').val('box').trigger('change');
$('#layout_text_align').val('left').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
$('#layout_left_side_width').val('50').trigger('change');
$('#layout_text_position').val('center_left').trigger('change');
$('#homepage_goal_position').val('center_right').trigger('change');
}
}
break;
case '2': //Two parts homepage
case '3': //Two parts homepage
$('#layout_homepage_full_widthBOX').hide();
$('#homepage_goal_type').find('option[data-side-by-side-disable="1"]').hide();
$('#layout_left_side_widthBOX').show();
$('#layout_bottom_spacingBOX').hide();
if (flagStatus=='onChange') { //Don't use it on user use the ready template so we don't have a conflict
$('#layout_left_side_width').val('50').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
$('#layout_text_align').val('center').trigger('change');
$('#layout_text_position').val('center_center').trigger('change');
$('#homepage_goal_position').val('center_center').trigger('change');
}
break;
}
}
function SetHomepageInlineType_Build_second_homepage_goal(flagStatus) {
var homepage_goal_type                = $('#homepage_goal_type').val();
$('#homepage_second_goal_type').empty();
$('#homepage_goal_type').children().each(function() {
$this = $(this);
$optionValue = $this.attr('value');
if ($this.data('support-second')==1 && $optionValue!=homepage_goal_type) {
$('#homepage_second_goal_type').append($this.clone());
}
$this.children().each(function() {
$this = $(this);
$optionValue = $this.attr('value');
if ($this.data('support-second')==1 && $optionValue!=homepage_goal_type) {
$('#homepage_second_goal_type').append($this.clone());
}
});
});
if (flagStatus=='onLoad' && $('#homepage_second_goal_type').data('default').length>0) {
$('#homepage_second_goal_type').val($('#homepage_second_goal_type').data('default'));
} else {
$('#homepage_second_goal_type').val('no');
}
}
function SetHomepageInlineType_Update_homepage_goal_place(flagStatus) {
if ($('#homepage_goal_place').val()=='top' || $('#homepage_goal_place').val()=='bottom') {
$('#homepage_goal_spaceBOX').fadeIn();
$('#homepage_goal_positionBOX').fadeOut();
$('#layout_left_side_widthBOX').fadeOut();
} else {
$('#homepage_goal_spaceBOX').fadeOut();
$('#homepage_goal_positionBOX').fadeIn();
$('#layout_left_side_widthBOX').fadeIn();
}
if (flagStatus=='onChange') {
switch($('#homepage_goal_place').val()) {
case 'right':
$('#layout_homepage_full_width').val('box').trigger('change');
$('#layout_text_align').val('left').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
$('#layout_left_side_width').val('50').trigger('change');
$('#layout_text_position').val('center_left').trigger('change');
$('#homepage_goal_position').val('center_right').trigger('change');
break;
case 'left':
$('#layout_homepage_full_width').val('box').trigger('change');
$('#layout_text_align').val('left').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
$('#layout_left_side_width').val('50').trigger('change');
$('#layout_text_position').val('center_left').trigger('change');
$('#homepage_goal_position').val('center_left').trigger('change');
break;
case 'bottom':
case 'top':
$('#layout_homepage_full_width').val('box').trigger('change');
$('#layout_text_align').val('center').trigger('change');
$('#layout_text_box_width').val('100').trigger('change');
$('#layout_left_side_width').val('50').trigger('change');
$('#layout_text_position').val('center_center').trigger('change');
$('#homepage_goal_position').val('center_center').trigger('change');
break;
}
/*
if ($('#homepage_layout_kind').val()=='1' && $('#homepage_goal_place').val()!='top' && $('#homepage_goal_place').val()!='bottom') {
$('#layout_left_side_widthBOX').show();
}
*/
}
}
function SetHomepageInlineType_Build_homepage_goal_place(flagStatus) {
var homepage_goal_type                = $('#homepage_goal_type').val();
var homepage_goal_type_align_limit    = $('#homepage_goal_type option[value="'+homepage_goal_type+'"]').data('align-limit');
$('#homepage_goal_place').empty();
var elementSupportedPositions = 'right,left,top,bottom';
if (typeof homepage_goal_type_align_limit !== "undefined" && homepage_goal_type_align_limit.length>0) {
elementSupportedPositions = homepage_goal_type_align_limit;
}
if ($('#homepage_layout_kind').val()=='2' || $('#homepage_layout_kind').val()=='3') {
elementSupportedPositions = elementSupportedPositions.replace('right,left','side');
}
elementSupportedPositions = elementSupportedPositions.split(',');
$(elementSupportedPositions).each( function( e ) {
$('#homepage_goal_place').append('<option value="'+elementSupportedPositions[e]+'">'+translations_homepage_goal_place[elementSupportedPositions[e]]+'</option>');
});
var homepage_goal_type_default_pos    = $('#homepage_goal_type option[value="'+$('#homepage_goal_type').val()+'"]').data('default-position');
if (homepage_goal_type_default_pos=='side') {
if ($('#homepage_layout_kind').val()=='2' || $('#homepage_layout_kind').val()=='3') {
$('#homepage_goal_place').val('side').trigger('change',flagStatus);
} else {
$('#homepage_goal_place').val('right').trigger('change',flagStatus);
}
} else {
$('#homepage_goal_place').val(homepage_goal_type_default_pos);
}
if (flagStatus=='onLoad') {
$('#homepage_goal_place').val($('#homepage_goal_place').data('default')).trigger('change');
}
if ($('#homepage_goal_place').val()=='top' || $('#homepage_goal_place').val()=='bottom') {
$('#homepage_goal_positionBOX').fadeOut();
$('#layout_left_side_widthBOX').fadeOut();
} else {
$('#homepage_goal_positionBOX').fadeIn();
$('#layout_left_side_widthBOX').fadeIn();
}
}
/**
* The function is responsible for the functionality when the user is from mobile device only.
*/
function WizardMobileHendlar() {
if ( $('html').data('device') === 'computer' ) return;
$('.explanation-video').addClass('hidden');
var $MainScreenTabsContainer = $('#wizardBox .wizardSideTabs');
var $site123Button = $('#wizardBox .top-nav .logo-container');
var $topNav = $('#wizardBox .top-nav');
var $bottomNav = $('#wizardBox .bottom-nav');
var prevStep = [];
var $backButton = $('#wizardBox .wizardBackToTabs-container');
var $currentPage = $('#wizardBox .current-page').parent();
var $accordions = $('.accordion-toggle');
var $accordionsContainer = $('#wizardBox .tab-content');
var $upgradeButton = $('#upgradeButton').parent();
var $dashboardButton = $('#backToDashBoard').parent();
var $addNewPageButton = $('#wizardBox #addNewPageModule');
var $mobilePreviewButtons = $('#wizardBox #mobilePreviewButtons');
var $wizardIFrames = $('#wizardBox iframe');
$addNewPageButton.hide();
$accordionsContainer.hide();
var fadeTime = 200;
var stepTree = [];
var goBack = true;
$backButton.off('click').on('click',function() {
/**
* http://blog.tcs.de/fix-historyback-not-working-in-google-chrome-safari-and-webkit/
*
* This option is the same as window.history.back()
* on IOS deices there is a problem with window.history.back()
* so we use instead window.history.go(-1)
*/
backEventHandler();
});
/**
* On click event append the href of the preview window
*/
$mobilePreviewButtons.on('click',function() {
/* we must open the window using `window.open` to support old IOS iPhone devices, otherwise
the child window will not have a `window.opener` property and the function `AddReturnToManagerBtn()`
will not show the back-to-manager button. https://stackoverflow.com/a/30226002/469161 */
window.open('/?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999),'_blank');
});
/**
* When choosing the style pelletes we close the div
*/
$('#theme_style').on('change',function() {
$('#all_style_pelletes').fadeOut(fadeTime);
});
/**
* The function is removing the orange color from the
* homepage tabs
*/
function removeOrangeColorFromAccordion() {
$('#homepageAccordion').children().each(function() {
$(this).removeClass('orangeFlash');
});
}
/**
* The function is responsible for hiding the main screen and showing the accordions
*/
function mainScreenFunction() {
$upgradeButton.addClass('hidden');
$dashboardButton.fadeOut(fadeTime);
$site123Button.fadeOut(fadeTime);
$MainScreenTabsContainer.fadeOut(fadeTime,function() {
$addNewPageButton.show();
$backButton.show();
$currentPage.show().find('a').text(prevStep[prevStep.length-1]);
});
}
/**
* The function is responsible for showing the relevant tabs to the user
*/
function accordionsFunctions() {
var $this = $accordions.filter('.selected-accordion');
var $mainContainer = $($this.data('parent'));
$mainContainer.find('.panel:visible').each(function(index, option) {
$(this).addClass('active-option');
});
var $panelHeading = $this.closest('.panel-heading');
var $selectedTab = $panelHeading.next();
$selectedTab.hide();
var currentPageText = $panelHeading.text().trim();
prevStep.push(currentPageText);
$currentPage.hide();
$currentPage.find('a').text(prevStep[prevStep.length-1]);
$currentPage.fadeIn(fadeTime);
$selectedTab.fadeIn(fadeTime);
$panelHeading.hide();
$mainContainer.find('.active-option').removeClass('panel');
$mainContainer.find('.active-option .panel-collapse').each(function() {
if ($(this).attr('id') != $selectedTab.attr('id')) {
$(this).parent().addClass('hidden');
}
});
}
/**
* The function is aback handler event,
* according to the relevant case show or hide the
* accordions / modal / tabs
*/
function backEventHandler() {
var action = stepTree.pop();
switch(action) {
case 'mainScreen':
$MainScreenTabsContainer.parent().css('height','100%');
$('.tab-pane.fade.in.active').fadeOut(fadeTime,function() {
$(this).removeClass('active');
$addNewPageButton.hide();
$currentPage.hide();
$backButton.hide();
$site123Button.fadeIn(fadeTime);
$MainScreenTabsContainer.fadeIn(fadeTime);
$upgradeButton.removeClass('hidden');
$dashboardButton.fadeIn(fadeTime);
});
$MainScreenTabsContainer.find('a').each(function(index, a) {
$MainScreenTabsContainer.parent().next().find('#'+$(a).data('tab-id')).fadeOut(fadeTime);
});
prevStep.pop();
break;
case 'accordions':
var $this = $accordions.filter('.selected-accordion');
var $mainContainer = $($this.data('parent'));
$mainContainer.find('.panel:visible').each(function(index, option) {
$(this).addClass('active-option');
});
var $panelHeading = $this.closest('.panel-heading');
var $selectedTab = $panelHeading.next();
$selectedTab.fadeOut(fadeTime,function() {
$(this).removeClass('active');
$this.removeClass('selected-accordion');
$mainContainer.fadeIn(fadeTime);
$panelHeading.show();
$mainContainer.find('.active-option').addClass('panel');
$mainContainer.find('.active-option .panel-collapse').each(function() {
$(this).parent().removeClass('hidden').removeClass('active-option');
});
prevStep.pop();
mainScreenFunction();
SetHomepageGoal();
removeOrangeColorFromAccordion();
});
break;
case 'modal-opened':
if ($('.modal:visible').length > 0) {
goBack = false;
$('.modal').each(function() {
if ($(this).hasClass('in')) {
$(this).modal('hide');
}
});
}
break;
case 'pages':
var $this = $accordionsContainer.find('.tab-pane.active');
var $pages = $accordionsContainer.find('.tab-pane#pagesTab');
$this.fadeOut(fadeTime,function() {
$this.removeClass('active');
$pages.show();
$pages.addClass('active');
$currentPage.show().find('a').text(prevStep[prevStep.length-1]);
});
prevStep.pop();
break;
}
}
/**
* The moduleMobileBottomMenu is scrolling with the window on IOS devices
* when it's inside the element modal-body so we moved it out
*/
function fixIOSModuleSideMenu() {
if ($('html').data('ios-device')) {
$('#moduleWindow').on('show.bs.modal',function() {
var $moduleWindow = $(this);
var $modalContent = $moduleWindow.find('.modal-content');
var $modalBody = $moduleWindow.find('.modal-body');
var $moduleMobileBottomMenu = $(this).find('#moduleMobileBottomMenu');
var $modalBody = $(this).find('.modal-body');
if ($modalBody.next().length == 0) {
$moduleMobileBottomMenu.detach();
$modalContent.append($moduleMobileBottomMenu);
}
/**
* on every time the modal is showed there is an event that is appending the side menu so we
* remove the existing modal side menu from the modal body
*/
if($modalBody.find('#moduleMobileBottomMenu').length > 0) {
$modalBody.find('#moduleMobileBottomMenu').remove();
}
});
/**
* The structure on IOS is different so we need to remove the
* bottom nav bar manually when the modal is closing
*/
$('#moduleWindow').on('hide.bs.modal',function() {
$(this).find('#moduleMobileBottomMenu').remove();
});
}
}
/**
* The function is detecting if the clicked element is
* a type input or textarea and hide the publish and preview button
* Note: we need this event because the buttons are huge and the
* keyboard will pop when it's a text element.
*/
function mobileKeyboardEvent(customDocument) {
$(customDocument).on('click',function() {
if ($(customDocument.activeElement).is("input") || $(customDocument.activeElement).is("textarea")) {
$bottomNav.fadeOut(fadeTime);
} else {
setTimeout(function() {
$bottomNav.fadeIn(fadeTime);
},200);
}
});
}
/**
* The function is stopping the bootstrap accordion
* because we don't need it on mobile
*/
function cancelAccordionEvent() {
$accordionsContainer.find('a.accordion-toggle').click(function(e){
return false;
});
}
$MainScreenTabsContainer.find('a').on('click',function() {
stepTree.push('mainScreen');
if ($(this).data('tab-id') == 'homepageTab') {
SetHomepageGoal();
removeOrangeColorFromAccordion();
}
prevStep.push($(this).text().trim());
var tabToShow = $(this).data('tab-id');
$accordionsContainer.children().each(function() {
if ($(this).attr('id') == tabToShow) {
$(this).addClass('active');
} else {
$(this).removeClass('active');
$(this).fadeOut(fadeTime);
}
});
mainScreenFunction();
});
/**
* The function is adding the homepage `tab` in the main screen special identification that it was triggered
* from the pages tab because there is a button that is using the homepage `tab` click so in order to tell
* the back button to what page to return we need this function.
*
* Note: The button `homepageAlternativeName_edit` is using the click event of the
* homepage tab in the main screen tabs.
*/
(function() {
$accordionsContainer.find('#homepageAlternativeName_edit').click( function() {
$accordionsContainer.find('#homepageTab').data('alternative-name-edit',true);
});
/* when clicking on the homepage tab from the main screen check if the button was clicked from
`homepageAlternativeName_edit` or the main screen
if the homepage tab was clicked from `homepageAlternativeName_edit` we replace the step
from `mainScreen` to `pages`*/
$MainScreenTabsContainer.find('a[data-tab-id="homepageTab"]').on('click',function( e ) {
if ( $accordionsContainer.find('#homepageTab').data('alternative-name-edit') ) {
stepTree.pop();
stepTree.push('pages');
$accordionsContainer.find('#homepageTab').data('alternative-name-edit',false);
}
});
})();
$accordions.off('click').on('click',function() {
stepTree.push('accordions');
$(this).addClass('selected-accordion');
accordionsFunctions();
});
cancelAccordionEvent();
$('.modulesEditButton').on('click',function() {
fixIOSModuleSideMenu();
EditPage();
});
/*
if ( window.history && window.history.pushState ) {
$(window).on('popstate', function() {
backEventHandler();
});
}
*/
/**
* If the user is using mobile device then we add indicator to the window.top
* so when the user is pressing preview we will use it on scripts.js
*/
window.top.s123_mobilePreview = true;
/**
* On every time the modal is opening we push to history the modal id (no use for the id  at the moment)
* but we need it so the back button will work.
*/
$('.modal').on('show.bs.modal',function() {
goBack = true;
/**
* if there is a bottom menu in the modal then create padding to the
* iframe to show the save / cancel buttons.
*/
if ($(this).find('#moduleMobileBottomMenu').length > 0) {
$(this).find('iframe').addClass('custom-padding');
}
});
/*
$('.modal').on('hide.bs.modal',function() {
if (goBack) {
/**
* http://blog.tcs.de/fix-historyback-not-working-in-google-chrome-safari-and-webkit/
*
* This option is the same as window.history.back()
* on IOS deices there is a problem with window.history.back()
* so we use instead window.history.go(-1)
*
*/
/*
window.history.go(-1);
}
});
*/
/**
* When clicking on <a> with href="#" it's messing with the browser back button
* so in order to prevent the history event we need to remove the empty
* href attr from <a>, for now we did that on the mobile only.
*/
$('a[href="#"]').removeAttr('href');
mobileKeyboardEvent(document);
/**
*  hide or show the save and preview buttons
*  when clicking on iframe text input's
*/
$wizardIFrames.on('load',function() {
var $iframe = $(this);
var iframeDocument = $iframe.get(0).contentWindow.document;
mobileKeyboardEvent(iframeDocument);
});
/**
* The function is removing the custom history on page load
* if there is a custom history.
* Note: custom history is the #hastag (anchor) and we are not
* supporting yet so we need to remove it
*/
(function() {
return;
if (window.location.href.indexOf('#') != -1) {
var timeOutInterval = 0;
setTimeout(removeHash,timeOutInterval);
function removeHash() {
/**
* http://blog.tcs.de/fix-historyback-not-working-in-google-chrome-safari-and-webkit/
*
* This option is the same as window.history.back()
* on IOS deices there is a problem with window.history.back()
* so we use instead window.history.go(-1)
*/
window.history.go(-1);
}
/**
* If there is a hashtag then repeat the action
* else remove the function from the listener
*/
function onhashchangeFun() {
if (window.location.href.indexOf('#') != -1) {
setTimeout(removeHash,timeOutInterval);
} else {
window.removeEventListener('hashchange',onhashchangeFun);
}
}
window.addEventListener('hashchange',onhashchangeFun);
}
})();
}
/**
* The function set the video type by toggle the inputs and change the require field.
*/
function SetVideoType() {
var $videoType           = $('#videoType');
var $home_video          = $('#home_video');
var $home_custom_video   = $('#home_custom_video');
$videoType.on('change.setVideoType',function() {
if ( $videoType.val() == 1 ) {
$home_video.closest('.form-group').hide();
$home_custom_video.closest('.form-group').show();
} else {
$home_custom_video.closest('.form-group').hide();
$home_video.closest('.form-group').show();
}
});
$videoType.trigger('change.setVideoType');
}
function PrintTextLayouts() {
var $chooseTextLayout = $('.chooseTextLayout');
var homepage_goal = $('#homepage_goal').val();
$chooseTextLayout.empty();
var $container  = $('<div>' +
'<div class="text-design-styles"></div>' +
'</div>');
var $styles = $container.find('.text-design-styles');
for ( id in textModulesArr ) {
var module = textModulesArr[id];
var $style = $('<div style="order:' + module.order + ';" data-id="' + module.id + '" class="text-design-button-container">'
+ '<img class="text-design-button-image" src="https://cdn-cms-localhost.f-static.com/ready_uploads/textLayout/v28/800_'+module.id+'_textLayout.jpg?v=' + $GLOBALS['v-cache'] +'" style="z-index:1;opacity: 1;">'
+ '</div>').appendTo($styles);
$style.find('.text-design-button-image').click( function( event ) {
var id = $(this).parent('.text-design-button-container').data('id');
var module = textModulesArr[id];
var more_settings = module.more_settings;
holdWizardSave = true;
ResetAllTextSettings();
if (more_settings !== 'undefined' && more_settings!='') {
var more_settings = jQuery.parseJSON( more_settings );
$.each (more_settings, function (key, value) {
if (key!='home_siteSlogan' && key!='home_siteSlogan_2' && key!='home_SecondSiteSlogan' && key!='home_buttonText' && key!='home_buttonText_1') {
$('#'+key).val(value).trigger('change');
} else {
if (key=='home_siteSlogan') {
if (value.length>0 && existingTitle1.length>0) {
$('#'+key).val(existingTitle1).trigger('change');
} else {
$('#'+key).val(value).trigger('change');
}
}
if (key=='home_siteSlogan_2') {
if (value.length>0 && existingTitle2.length>0) {
$('#'+key).val(existingTitle2).trigger('change');
} else {
$('#'+key).val(value).trigger('change');
}
}
if (key=='home_SecondSiteSlogan') {
if (value.length>0 && existingTitle3.length>0) {
$('#'+key).val(existingTitle3).trigger('change');
} else {
$('#'+key).val(value).trigger('change');
}
}
if (key=='home_buttonText') {
if (value.length>0 && existingHomeButton1.length>0) {
$('#'+key).val(existingHomeButton1).trigger('change');
} else {
$('#'+key).val(value).trigger('change');
}
}
if (key=='home_buttonText_1') {
if (value.length>0 && existingHomeButton2.length>0) {
$('#'+key).val(existingHomeButton2).trigger('change');
} else {
$('#'+key).val(value).trigger('change');
}
}
}
});
}
ChangePreviewLive('home_text_size');
$('#homepageTextCustomBoxStyle').val(module.customClass).trigger('change');
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
ShowHideTextLayoutElementsIfUnused();
});
}
$container.appendTo($chooseTextLayout);
}
function ShowHideTextLayoutElementsIfUnused() {
var homepage_goal = $('#homepage_goal').val();
var titleIndex = 1;
$('#homepageTitle1').hide();
$('#homepageTitle2').hide();
$('#homepageTitle3').hide();
if ($('#home_siteSlogan').val().length>0 || ( $('#home_siteSlogan_2').val().length==0 && $('#home_SecondSiteSlogan').val().length==0 )) {
$('#homepageTitle1').show();
$('#homepageTitle1 .fieldHeaders label .titleCount').remove();
$('#homepageTitle1 .fieldHeaders label').append(' <span class="titleCount">' + titleIndex + '</span>');
titleIndex++;
}
if ($('#home_siteSlogan_2').val().length>0) {
$('#homepageTitle2').show();
$('#homepageTitle2 .fieldHeaders label .titleCount').remove();
$('#homepageTitle2 .fieldHeaders label').append(' <span class="titleCount">' + titleIndex + '</span>');
titleIndex++;
}
if ($('#home_SecondSiteSlogan').val().length>0) {
$('#homepageTitle3').show();
$('#homepageTitle3 .fieldHeaders label .titleCount').remove();
$('#homepageTitle3 .fieldHeaders label').append(' <span class="titleCount">' + titleIndex + '</span>');
titleIndex++;
}
}
/**
* The function is generating styles boxes and adding them to the page.
*
* @pram {integer} stylesModulesArr - Styles that we fetch from ajax.
* @pram {jq object} $container - The container need to append the styles.
*/
function PrintUniqueStylesLayouts( stylesModulesArr, $container ) {
var $chooseUniqueStyle = $('.chooseUniqueStyle');
var $styles = $container.find('.unique-styles');
for ( id in stylesModulesArr ) {
var html = '';
var module = stylesModulesArr[id];
var more_settings = module.more_settings;
more_settings = tryParseJSON(more_settings);
if (childLanguage=='zh-CHT' || childLanguage=='zh-CHS') {
var two_letter_language = childLanguage;
} else {
var two_letter_language = childLanguage.substring(0, 2);
}
if ($.inArray(two_letter_language, ['he','pl','ar','ja','sv','no','tr','ru','de','el','ko','zh-CHT','zh-CHS','fr','es','pt','it','ro'])!='-1') {
var templateImagePath = ''+$GLOBALS['cdn-interface-files']+'/admin/InterfaceStatisFiles/stylesImages/'+module.id+'_'+two_letter_language+'_stylesLayoutV5.jpg?v=' + $GLOBALS['v-cache'] +'';
} else {
var templateImagePath = ''+$GLOBALS['cdn-interface-files']+'/admin/InterfaceStatisFiles/stylesImages/'+module.id+'_en_stylesLayoutV5.jpg?v=' + $GLOBALS['v-cache'] +'';
}
html += '<div style="order:' + module.order + ';" data-id="' + module.id + '" class="unique-styles-button-container">';
html += '<img class="unique-styles-button-image" src="'+templateImagePath+'" style="z-index:1;opacity: 1;">';
html += '</div>';
var $style = $(html);
$style.appendTo($styles);
/**
* Save the style inside of the data attribute because we need the `more_settings` json after
* the user is clicking on the style.
*
* Note: We specifically save the style in the data because we may need more data from it
* in the future.
*/
$style.data('module-style',module);
$style.find('.unique-styles-button-image').on('ready_template_change',function( event ) {
var $this = $(this);
var $parentEle = $this.closest('.unique-styles-button-container');
$chooseUniqueStyle.find('.unique-styles-button-container').removeClass('active');
$parentEle.addClass('active');
var id = $parentEle.data('id');
var style = $this.closest('.unique-styles-button-container').data('module-style');
var more_settings = style.more_settings;
$chooseUniqueStyle.trigger('style_change',true);
holdWizardSave = true;
ResetAllTextSettings();
if (more_settings !== 'undefined' && more_settings!='') {
var more_settings = jQuery.parseJSON( more_settings );
$.each (more_settings, function (key, value) {
if (key=='home_siteSlogan' || key=='home_siteSlogan_2' || key=='home_SecondSiteSlogan') {
value = value.replace(/<br\/>/ig,"\n");
value = value.replace(/<br>/ig,"\n");
}
if (key=='font_slogan' || key=='font_slogan_2' || key=='font_second_slogan') {
if (childLanguage=='he') {
value = 'Alef';
}
if (childLanguage=='ar') {
value = 'Amiri';
}
}
$('#'+key).val(value).trigger('change',[ "ReadyTemplateChange" ]);
});
}
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('structuresHandler');
$('#template').trigger('change');
GetImageMainColors($('#home_slider_image_1').val().replace('normal_','400_'));
ShowHideTextLayoutElementsIfUnused();
Wizard.homePageBgOptions.showHideBackgroundOptions();
});
/**
* The event is responsible for checking if the user need to be warned about the ready template
* changes every 1 hour when he is selecting it.
*
* Note The users that will be warned are existing users
*/
$style.find('.unique-styles-button-image').on('click',function( event ) {
var $this = $(this);
var changeTemplate = false;
if ( $.cookie(websiteID + '_readyTemplateSkipWarning') ) {
$this.trigger('ready_template_change');
} else {
/**
* Bootstrap Popover - Add message that will be shown 1 in a hour that will notify
* the user that his action will overwrite his previews settings
*
* Documentation : https://getbootstrap.com/docs/4.0/components/popovers/
*/
$this.popover({
container: 'body',
title: translations.readyTemplates.warningTitle,
content: translations.readyTemplates.warningContent,
html: true,
trigger: 'manual',
template: '<div class="popover r-t"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><h3 class="popover-footer"> <div class="btn-group">  <a class="confirmation btn btn-success btn-mini"><i class="glyphicon glyphicon-ok"></i> <i class="icon-ok-sign icon-white"></i> '+translations.Continue+'</a><a class="cancel btn btn-default btn-mini"><i class="glyphicon glyphicon-remove"></i> <i class="icon-remove-sign"></i> '+translations.Cancel+'</a></div></h3></div>',
placement: $('html').data('device') !== 'computer' ? 'auto' : intrface_align_reverse
})
.one('shown.bs.popover.rt_warning', function () {
$('.popover.r-t .confirmation').on('click.rt_warning', function( event ) {
readyTemplates_SetCookieForOneHour();
changeTemplate = true;
$this.popover('hide');
});
$('.popover.r-t .cancel').on('click.rt_warning', function( event ) {
$this.popover('hide');
});
})
.one('show.bs.popover.rt_warning', function () {
$('body').append('<div class="backdropManaul"></div>');
$(window).one('blur.rt_warning', function( event ) {
$this.popover('hide');
});
$('.backdropManaul').one('click.rt_warning', function () {
$this.popover('hide');
});
})
.one('hide.bs.popover.rt_warning', function () {
$('.backdropManaul').remove();
})
.one('hidden.bs.popover.rt_warning', function () {
if ( changeTemplate ) $this.trigger('ready_template_change');
})
.popover('show');
}
});
}
$container.prependTo($chooseUniqueStyle);
if ( newUser ) readyTemplates_SetCookieForOneHour();
/**
* The function is setting a cookie for 1 hour to skip the warning message
*
* Documentation: https://stackoverflow.com/a/3795002
*/
function readyTemplates_SetCookieForOneHour() {
var now = new Date();
var time = now.getTime();
time += 3600 * 1000;
now.setTime(time);
document.cookie = websiteID + '_readyTemplateSkipWarning = 1' + '; expires=' + now.toUTCString() + '; path=/';
}
}
/**
* The function is responsible for updating the wizard changes after clicking on the undo button
*
* @param {object} dbSettings - The settings that the user had before the changes
* @param {string} wizardUndoRefreshHelper - Refresh type we need to stow
*/
function Wizard_UpdateInputs( settings ) {
if ( !settings ) return;
if ( typeof settings === 'string' ) settings = tryParseJSON(settings);
$.each(settings, function ( key, value ) {
var $input = $('#'+key);
switch ( $input.prop('type') ) {
case 'checkbox':
$input.prop('checked',value);
break;
default:
$input.val(value);
break;
}
/**
* For upload files image types we also to refresh the inputs preview e.g. remove image, focus point.
* Note: The upload file video type don't have a buttons so we don't need to do with it anything.
*/
if ( $input.hasClass('file-upload-input-field') && !$input.hasClass('home_video_background') ) {
uploadFile_UpdateInput($input);
}
});
}
/**
* The function is refreshing the upload file input preview.
*
* @param {object} $input - Upload file input.
*/
function uploadFile_UpdateInput( $input ) {
var id = $input.get(0).id;
var image = $input.val();
var tiny_image = image.replace("normal_", "100_");
if ( image.indexOf('site123-image-icon') != -1 ) {
UpdateImagePreview(id, { icon: image });
} else {
UpdateImagePreview(id, { normal: image, tiny: tiny_image });
}
/**
* Website Full Box / Flying Full Box Background Image - On empty upload file we also need to
* hide or show the color box.
*/
if ( id === 'website_background_color_image' ) {
if ( image !== '' ) {
$('#website_background_color').closest('.form-group').hide();
} else {
$('#website_background_color').closest('.form-group').show();
}
}
}
function ManageLanguageButtonActiveEvent() {
$('.ManageLanguageButton').off('click').on('click',function() {
if ( !$.isNumeric(packageNUM) ) return;
var upgrade = OpenPremiumFeatures(packageNUM) < 3;
if ( upgrade && OpenPremiumFeatures(packageNUM) == 2 && websiteID < 642600 ) upgrade = false;
if ( upgrade ) {
upgradeFeaturesManager.show('languagesManager');
return;
}
var $this = $(this);
var languageID = $this.data('language-id');
var heighestHeightNUM = $(window).outerHeight(true) - 170;
if ( languageID ) {
$('#languagesManager').find('.modal-body').html('<iframe id="languagesManagerIframe" name="languagesManagerIframe" src="/versions/'+versionNUM+'/wizard/languagesManager/translate.php?w='+websiteID+'&id='+languageID+'" style="width:100%;height:'+heighestHeightNUM+'px;margin:0;padding:0;border:none;"></iframe>');
} else {
$('#languagesManager').find('.modal-body').html('<iframe id="languagesManagerIframe" name="languagesManagerIframe" src="/versions/'+versionNUM+'/wizard/languagesManager/index.php?w='+websiteID+'" style="width:100%;height:'+heighestHeightNUM+'px;margin:0;padding:0;border:none;"></iframe>');
}
$('#languagesManager').modal('show');
});
}
function UpdateJquerySlider(id) {
var val = $('#'+id+'').val();
$('#'+id+'_slider').slider('value',val);
$('#'+id+'_view').html(val);
}
/**
* The function reinitialize dynamic elements after publish.
* When the user publishes his site we update `statusNUM=1` for
* the necessary table's records, then we insert new records with
* `statusNUM=2` for the interface. The issue is that the records
* ids are changed now so we need to update all the dynamic elements.
* e.g. Wizard >> Plugins >> Edit - the button redirect to Edit
* Plugin page with an id that need to be updated.
*/
function AfterPublishReinitialize() {
GetActivePlugins();
GetActiveLanguages();
}
/**
* The function serialize the modules list and update the
* parent id for every module children's.
*/
function SerializeModulesParentId() {
$('#sortable').nestedSortable('toHierarchy').forEach( function( module ) {
$('#card_'+module.id).data('parent-id','');
if ( !module.children ) return;
module.children.forEach( function( children ) {
$('#card_'+children.id).data('parent-id', module.id);
});
});
}
/**
* The function sort the preview modules and sync there order related to the
* pages list, we use it to prevent preview reload/refresh when dragging pages.
*/
function SortPreviewModules( sortMenus ) {
if ( !Wizard.Preview.ready ) return;
Wizard.Preview.$('#s123ModulesContainer').css({
display: 'flex',
flexDirection: 'column'
});
var order = 0;
$('#sortable').nestedSortable('toArray').forEach( function( module ) {
if ( !module.id ) return;
var $page = Wizard.Pages.getPage(module.id);
if ( $page.data('moduletypenum') == '78' ) return;
if ( !IsSinglePage() && $page.data('module-mp-show-in-home') != '1' ) return;
var $p_module = Wizard.Preview.getModule(module.id);
$p_module.css({ order: order });
if ( order % 2 == 0 ) {
$p_module.addClass('bg-primary');
} else {
$p_module.removeClass('bg-primary');
}
order += 1;
});
Wizard.Preview.$document.trigger('s123.page.ready.refreshParallaxImages');
Wizard.Preview.$document.trigger('s123.page.ready.refreshAOS');
/**
* Navigation Menus Update - In the future we like to upgrade this process
* by updating the menus also via JavaScript ant not using Ajax.
*/
if ( sortMenus ) {
$("#wizardForm").off('ajaxSuccess').one( 'ajaxSuccess', function( event ) {
UpdatePreviewAreaByAjax([
'#mainNav ul.navPages',
'footer.global_footer ul.navPages',
'#header #top-menu .navPages'
],'',true);
});
}
}
function buttonSettingBoxChange($buttonSettingBox,button) {
switch (button.val()) {
case '1':
$buttonSettingBox.find('.redirectInputBox').hide();
$buttonSettingBox.find('.scrollSectionBox').show();
break;
case '2':
case '3':
$buttonSettingBox.find('.redirectInputBox').show();
$buttonSettingBox.find('.scrollSectionBox').hide();
break;
}
}
/**
* The function reload the preview iFrame according to the sent URL.
*
* @param {string} url - The URL that we like to set to the preview iFrame.
*/
function ReloadPreviewIframe( url ) {
if ($.browser.msie || $.browser.msedge) {
setTimeout(function() {
MakeThePreview(url);
},100);
} else {
MakeThePreview(url);
}
}
function MakeThePreview(url) {
var $frame = $('#websitePreviewIframe');
$frame.contents().find('html, body').stop(true,false);
$frame.data('reload-process',true);
$frame.attr( 'src', url);
}
/**
* The function is showing or hiding the logo settings according to the logo type.
*/
function ShowIconStyle() {
if ( $('#siteLogo').val().indexOf('site123-image-icon') !== -1 ) {
$('#siteLogoStyleBOX').show();
$('#siteLogoImageStyleBOX').hide();
$('#logoFileSizeBox').hide();
$('#siteLogoStyle').trigger('change.style_change');
return;
}
if ($('#siteLogo').val()!='') {
$('#siteLogoStyleBOX').hide();
$('#siteLogoImageStyleBOX').show();
$('#logoFileSizeBox').show();
if ( $('#siteLogoImageStyle').val() === 'website-name-active' ) {
$('#websiteLogoAndName [data-logo-require="text"]').show();
} else {
$('#websiteLogoAndName [data-logo-require="text"]').hide();
}
return;
}
$('#siteLogoStyleBOX').hide();
$('#siteLogoImageStyleBOX').hide();
$('#logoFileSizeBox').hide();
$('#websiteLogoAndName [data-logo-require="text"]').show();
return;
}
/**
*   Add Shortcuts options for the wizard and for website Preview Iframe By pressing
*   Ctrl+P shortcut the user can Publish his own website, pressing 1 Open Homepage
*   tab, pressing 2 Open Pages tab, pressing 3 Open Design tab pressing 4 Open
*   Settings tab, pressing 5 Close tabs.
*   You can add cases with letter for more shortcuts.
*/
function AddKeyboardShortcuts() {
keydown($(document));
$('#websitePreviewIframe').load( function() {
keydown($(this).contents());
});
/**
* Checking which key the user pressing.
*/
function keydown( $document ) {
$document.keydown( function(event) {
var tag = event.target.tagName.toLowerCase();
if ( $('.modal.in').length !== 0 ) return;
if ( tag !== 'input' && tag !== 'textarea' ) {
switch (event.which) {
case 27:
event.preventDefault();
$('#website_desktop_view').trigger( 'click' );
break;
case 48:
event.preventDefault();
$('#wizardTab0button').trigger( 'click' );
break;
case 96:
event.preventDefault();
$('#wizardTab0button').trigger( 'click' );
break;
case 97:
event.preventDefault();
$('#wizardTab2button').trigger( 'click' );
break;
case 49:
event.preventDefault();
$('#wizardTab2button').trigger( 'click' );
break;
case 50:
event.preventDefault();
$('#wizardTab4button').trigger( 'click' );
break;
case 51:
event.preventDefault();
$('#wizardTab6button').trigger( 'click' );
break;
case 98:
event.preventDefault();
$('#wizardTab4button').trigger( 'click' );
break;
case 52:
event.preventDefault();
$('#wizardTab8button').trigger( 'click' );
break;
case 99:
event.preventDefault();
$('#wizardTab6button').trigger( 'click' );
break;
case 53:
event.preventDefault();
$('#wizardTab9button').trigger( 'click' );
break;
case 100:
event.preventDefault();
$('#wizardTab8button').trigger( 'click' );
break;
}
}
/**
* By pressing on Ctrl+S shortcut the user can make Publish.
*/
if (event.ctrlKey || event.metaKey) {
switch (String.fromCharCode(event.which).toLowerCase()) {
case 's':
event.preventDefault();
$('#publishWebsiteButton').trigger( 'click' );
break;
case 'z':
/* prevent undo from working when user is still writing in input check if target is input or textarea
solution: https://stackoverflow.com/a/8300684*/
if ( !$(event.target).is('textarea') && !$(event.target).is('input') ) {
event.preventDefault();
WizardUndoRedoHandler.$undoBtn.trigger( 'click' );
}
break;
case 'y':
/* prevent redo from working when user is still writing in input check if target is input or textarea
solution: https://stackoverflow.com/a/8300684*/
if ( !$(event.target).is('textarea') && !$(event.target).is('input') ) {
event.preventDefault();
WizardUndoRedoHandler.$redoBtn.trigger( 'click' );
}
break;
}
}
});
}
}
var alreadyRunningScrollID;
function CheckIfFormValid() {
var result = true;
if ( !$('#wizardForm').valid() ) {
result = false;
}
if ( $('#sortable li').length > 0 ) {
$("#sortable li").each( function() {
var $this = $(this);
if ($this.find('.module_name').length>0 && $.trim($this.find('.module_name').val()).length==0) {
result = false;
if ($this.find('.alertModuleNameEmpty').length==0) {
$('<div class="alertModuleNameEmpty" style="color:red;">'+translations.fieldRequired+'</div>').insertAfter($this.find('.input-group'));
}
} else {
if ($this.find('.alertModuleNameEmpty').length>0) {
$this.find('.alertModuleNameEmpty').remove();
}
}
});
}
return result;
}
function ShowFormErrorToUser() {
bootbox.alert({
title: translations.Warning,
message: translations.beforeMoveTabExp
});
trackJsEvent(true,'User cant move to the next tab in his wizard');
try {
hj('tagRecording', ['User-cant-move-tab']);
}
catch(err) {
}
var validator = $("#wizardForm").validate();
if (validator.errorList.length>0) {
var firstIdError = $(validator.errorList[0].element).attr('id');
var tabID = $('#'+firstIdError).parents('.tab-pane').attr('id');
} else {
var tabID = 'pagesTab';
}
OpenWizardTab(tabID,true);
ShowWizard();
}
function ActiveDisableInsideAdsManager() {
if ($('#ad_manger_active').is(":checked")==true) {
$('#adManagerInsideLevel').show();
} else {
$('#adManagerInsideLevel').hide();
}
}
function CheckIfTheUserHaveAdsPromoOnHomepageModules() {
var json = new Array();
var i = $('#sortable li.moduleSortList').length;
var adsOnHomepage = false;
if ( i > 0 ) {
$("#sortable li.moduleSortList").each( function() {
var $this = $(this);
var toolID          = $this.data('moduletypenum');
if (toolID=='86') {
adsOnHomepage = true;
}
$this.css('z-index',i);
i--;
});
}
if (adsOnHomepage==true) {
$('#adHomepageActive').show();
$('#adHomepageDisable').hide();
} else {
$('#adHomepageActive').hide();
$('#adHomepageDisable').show();
}
}
function OpenWizardTab(tabID,fromError) {
var $tabContent = $('#'+tabID);
SettingsBox.hide();
if ( !$tabContent.is(":visible") || fromError==true ) {
$('.wizardSideTabs > li.active').removeClass('active');
$('.tab-pane').hide().removeClass('active');
$('[data-tab-id='+tabID+']').parent('li').addClass('active');
$tabContent.show().addClass('active');
ShowWizard();
if ( tabID == 'pagesTab' ) {
Wizard.Tabs.pages.setAddNewPagePosition();
Wizard.Tabs.pages.t.trigger('open_wizard_tabs');
}
if ( tabID == 'homepageTab' ) {
WizardUndoRedoHandler.enable();
$('#wizardTab2button').trigger('click.home_page_load');
Wizard.Tabs.home.t.trigger('open_wizard_tabs');
} else {
if ( tabID == 'designTab' ) {
Wizard.Tabs.design.t.trigger('open_wizard_tabs');
} else if ( tabID == 'settingsTab' ) {
Wizard.Tabs.settings.t.trigger('open_wizard_tabs');
} else if ( tabID == 'domainTab' ) {
Wizard.Tabs.domain.t.trigger('open_wizard_tabs');
}
WizardUndoRedoHandler.disable();
}
} else {
if( ace.vars['touch'] ) {
return;
}
$('.tab-pane').hide();
$('.wizardSideTabs > li.active').removeClass('active');
website_desktop_view();
if ( tabID == 'pagesTab' ) {
Wizard.Tabs.pages.setAddNewPagePosition();
}
if ( tabID == 'homepageTab' ) {
WizardUndoRedoHandler.enable();
$('#wizardTab2button').trigger('click.home_page_load');
} else {
WizardUndoRedoHandler.disable();
}
}
}
/**
* The function scroll the preview iframe to a specific area.
*/
function scrollToPointInPreview() {
/**
* Exit if the iFrame is in reload process because of IE bug.
* If the scrolling animation is in process and we reload the page
* IE browser throw JS errors.
*/
if ( $('#websitePreviewIframe').data('reload-process') ) return;
var $frame = $('#websitePreviewIframe').contents();
if ( window.scrollPreview && $frame.find(window.scrollPreview).length !== 0 ) {
var offset = $frame.find('#mainNav').outerHeight();
if ( !$.isNumeric(offset) ) offset = 0;
$frame.find('html, body').scrollTop($frame.find(window.scrollPreview).offset().top - offset);
/*
* We decide to stop the animation, if we like to return it we need
* to remove the two lines Up to this note and return the script in
* the Bottom of this note.
*/
/*
if ( window.scrollPreview != alreadyRunningScrollID ) {
alreadyRunningScrollID = window.scrollPreview;
var offset = $frame.find('#mainNav').outerHeight();
if ( !$.isNumeric(offset) ) offset = 0;
$frame.find('html, body').stop().animate({
scrollTop: $frame.find(window.scrollPreview).offset().top - offset
}, 500, function() {
alreadyRunningScrollID = '';
});
}
*/
}
window.scrollPreview = '';
}
function AutoSaveWizard(isPreviewReloadStatus,force) {
Wizard.homePageBgOptions.showHideBackgroundOptions();
isPreviewReload = isPreviewReloadStatus;
isWizardChange = true;
if (force==true) {
SaveWizard();
}
}
function AutoSaveInerval() {
SaveWizard();
}
function GetMenuScrollOffset(tempNUM) {
var header_size = $('#header_size').val();
var scrollHeaderSize = 60;
if (tempNUM!=2) {
switch (header_size) {
case '1':
scrollHeaderSize = 60;
break;
case '2':
scrollHeaderSize = 70;
break;
case '3':
scrollHeaderSize = 80;
break;
case '3':
scrollHeaderSize = 100;
break;
}
} else {
switch (header_size) {
case '1':
scrollHeaderSize = 60;
break;
case '2':
scrollHeaderSize = 70;
break;
case '3':
scrollHeaderSize = 80;
break;
case '4':
scrollHeaderSize = 100;
break;
}
}
if (layoutArr[tempNUM].menuPlace=='left' || layoutArr[tempNUM].menuPlace=='right') {
scrollHeaderSize = 0;
}
if (typeof Wizard.Preview.window !== "undefined") {
Wizard.Preview.window.menuScrollOffset = scrollHeaderSize;
}
}
function SetLayout(val,templateWizard) {
var $frame = $('#websitePreviewIframe').contents();
$frame.find('#layoutNUM').val(val);
$frame.find('#layoutMenuPositionTXT').val(layoutArr[val].menuPlace);
GetMenuScrollOffset(val);
if (templateWizard!=1) {
$('#header_width').val('wide');
$('#header_opacity').val('full');
$('#header_style').val('1');
$('#header_size').val('1');
$('#header_logo_back_color').val('2');
}
$('#template').val(val).trigger('change');
SetHomepageGoal();
LayoutPickupManager();
}
function SaveWizard() {
if ( isWizardChange == true ) {
WizardUndoRedoHandler.buttonsDisable();
if (holdWizardSave==true) {
return false;
}
if (wizardReadyToGo==false) {
WizardLoadError();
return false;
}
var isFormValid = CheckIfFormValid();
$('#savedStatus').html(translations.Saving).show();
WizardUndoRedoHandler.add();
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/wizardO.php",
context: $("#wizardForm"),
data: (tools_manage_is_change == true) ? $("#wizardForm").serialize()+'&tools_manage='+encodeURIComponent(tools_manage)+'&wizardVersionNUM='+wizardVersionNUM : $("#wizardForm").serialize()+'&wizardVersionNUM='+wizardVersionNUM, // serializes the form's elements.
success: function( data ) {
WizardUndoRedoHandler.buttonsEnable();
$('#wizardUndoRefreshHelper').val('');
if ( data == 'Version Update!') {
bootbox.confirm({
title: '<span><b>'+translations.wizardVersionUpdateTitle+'</b></span>',
message: translations.wizardVersionUpdateExp,
buttons: {
confirm: {
label: translations.update,
className: 'btn-danger'
},
cancel: {
label: translations.Cancel,
className: 'btn-default'
}
},
callback: function( result ) {
if ( result ) window.location.reload();
}
});
}
if ( window.reloadWizardAfterSave ) {
disableLeavePopup = true;
bootbox.alert({
message: window.reloadWizardAfterSaveMessage,
}).on("hidden.bs.modal", function() {
window.location.reload();
});
}
if ( data == 'Admin User') {
bootbox.alert({
title: '<span class="text-danger"><b>Admin user can not update user website. Sorry :)</b></span>',
message: 'Admin user can not update user website. Sorry :)'
});
}
if ( window.reloadPreviewCSS ) window.reloadPreviewCSS();
RefreshPreview();
if ( data != '.') {
$('#savedStatus').html(translations.InternetNetworkError);
} else {
setTimeout(function() {
$('#savedStatus').html(translations.Saved);
},500);
}
},
error: function(data) {
$('#savedStatus').html(translations.InternetNetworkError);
console.log(translations.sorryGotError);
}
});
tools_manage_is_change = false;
isWizardChange = false;
}
}
/**
* Build the Modules Tool JSON.
*/
function BuildToolJSON() {
var json = new Array();
var i = $('#sortable li.moduleSortList').length;
var promoCount = 1;
if ( i > 0 ) {
$("#sortable li.moduleSortList").each( function() {
var $this = $(this);
var moduleID        = $this.data('moduleid');
var parentId        = $this.data('parent-id');
var toolID          = $this.data('moduletypenum');
var showInMenu      = $this.data('module-showInMenu');
var showInFooter    = $this.data('module-show-in-footer');
var hideFrontModule = $this.data('module-hide-front-module');
var mp_showInMenu   = $this.data('module-mp-show-in-menu');
var mp_showInHome   = $this.data('module-mp-show-in-home');
var style           = $this.data('module-style');
var modulesArrID    = $this.data('modules-arr-id');
var styleContent    = $this.data('module-style-content');
var title           = $this.find('.module_name').val();
var url             = GetModuleSetting(moduleID,'url');
var settings        = GetModuleSetting(moduleID,'settings');
if (toolID==1000) {
$this.find('.promoModuleInput').val(translations.Promo + ' ' + promoCount);
promoCount++;
}
if (url=='' || !url) {
url             = $this.data('url');
url             = CheckPageURLinsideJSON(moduleID,url);
if (url=='' || !url) {
url         = moduleID;
}
}
json.push({
moduleID: moduleID,
parentId: parentId,
toolID: toolID,
title: title,
showInMenu: showInMenu,
showInFooter: showInFooter,
hideFrontModule: hideFrontModule,
mp_showInMenu: mp_showInMenu,
mp_showInHome: mp_showInHome,
style: style,
modulesArrID: modulesArrID,
styleContent: styleContent,
url: url,
settings: settings
});
$this.css('z-index',i);
i--;
});
}
tools_manage = JSON.stringify(json);
tools_manage_is_change = true;
}
/**
* The function reload every preview CSS file that has the class "reloadable-css".
* We use to update the preview changes without reloading the page. The function
* must called after the changes already saved, so we call it as a callback function
* of `SaveWizard()` function, this why we detach it from the window object in the end.
*
* @param {function} callback - A callback function to execute when the CSS loaded.
*/
function ReloadPreviewCSS( callback ) {
var $frame = $('#websitePreviewIframe').contents();
/**
* Prevent Duplicated CSS Files - The function duplicate the CSS files
* and remove the source files only after the duplicated CSS files loaded.
* Because of this, it can not run again until all the source CSS removed.
* Otherwise it duplicate the CSS files again and again. To prevent this
* issue we delayed the function execution to the moment the source removed.
*/
if ( $frame.find('link.reloadable-css.rpc-loading').length !== 0 ) {
clearTimeout(window.reloadPreviewCssTimeout);
window.reloadPreviewCssTimeout = setTimeout( function() {
ReloadPreviewCSS(callback);
}, 500);
return;
}
var $css = $frame.find('link.reloadable-css');
/**
* Reload Reloadable CSS Files - Create a clone from the CSS file, change its URL to prevent
* cache, append it to the page, wait until it loaded and remove the source CSS. We must wait
* until it loaded because IE browsers have rendering issues.
* Note: Do not use `$this.clone()` because IE Edge V15 having an issue.
*/
$css.each( function() {
var $this = $(this);
var $clone = $('<link class="reloadable-css" href="'+PreventUrlBrowserCache($this.get(0).getAttribute('href'))+'" rel="stylesheet" type="text/css">');
var loaded = false;
$clone.addClass('rpc-loading').load(function() {
$this.remove();
$clone.removeClass('rpc-loading');
if ( callback ) callback.call(this);
loaded = true;
});
$clone.insertAfter($this);
/**
* We like to call the callback function also if from some reason the file didn't loaded
* to prevent issues, e.g. a loading message that will be removed. Note: its never happen
* that it didn't loaded we just do it to be sure.
*/
setTimeout(function() {
if (loaded) return;
$this.remove();
$clone.removeClass('rpc-loading');
if ( callback ) callback.call(this);
},5000);
});
window.reloadPreviewCSS = false;
/**
* Chrome Rendering Issue - Chrome has a problem on rendering, after changing the CSS URL its
* rendering the page only after the user move the mouse. I did not find any real solution
* to this issue but triggering the Window Resize event is working. To see the problem, remove
* this line, then go to `Design >> Styles` and change a style from the select box without moving
* the mouse after selecting the style. You will see that the color is not changing, if you
* will move the mouse a little you will see the changes.
* Another working solution is: `$('#websitePreviewIframe').hide().show(0);`.
* Source: http://stackoverflow.com/questions/8840580/force-dom-redraw-refresh-on-chrome-mac.
*/
$(window).trigger('resize');
Preview_TriggerS123PageReadyAndLoad();
/**
* iFrames Reload - We reload the CSS only at the main window so the changes are
* not apply to iFrames. To handle it we reload the needed iFrames.
*/
$frame.find('iframe.reloadable-iframe').each( function( index, iframe ) {
iframe.src = iframe.src;
});
}
/**
* The function add/edit a timestamp parameter to a sent URL for
* preventing the browsers from saving cache for it.
*/
function PreventUrlBrowserCache( url ) {
var timestamp = new Date().getTime();
var regObj = new RegExp('site123C=[0-9]*','ig');
if( regObj.test(url) ) {
url = url.replace(regObj,'site123C=' + timestamp);
} else {
url += (url.indexOf('?') === -1 ? '?' : '&') + 'site123C=' + timestamp;
}
return url;
}
function ChangePreviewLive( obj ) {
var $eID = typeof obj === 'string' ? obj : $(obj).attr('id');
var tempNUM = $('#template').val();
var $frame = $('#websitePreviewIframe').contents();
if ( !Wizard.Preview.ready || $frame.length === 0 ) return;
/**
* Homepage Redirect - On some cases the preview is not displaying the
* website homepage, and the user edit elements that placed on it. We
* redirect the user to the homepage to show him the changes.
*/
if ( !IsPreviewAtHomepage() ) {
clearTimeout(window.ChangePreviewLive_finishedEditing);
window.ChangePreviewLive_finishedEditing = setTimeout( function() {
AutoSaveWizard(true,true);
},500);
return;
}
/**
* We check if the user inside a multi language preview,
* if so we like to reload the preview to the main language
* and then make the changes.
*/
if ( Wizard.Preview.ready && Wizard.Preview.window.multiLanCode != '' ) {
PreviewWebsiteLanguage();
return;
}
if ( $eID=='name' || $eID == 'siteLogoImageStyle' ) {
$('.breadcrumb').find('.active').html(escapeHtml($('#name').val()));
$('.page-header').find('h1').html(escapeHtml($('#name').val()));
/* we have different structures so we use multiple selectors,
we use `escapeHtml()` to escape HTML entities (<,>,etc.) */
$frame.find('.logo_name .website-name,.website-name.website-name-preview-helper,.footer_2 .website-name-preview-helper').html(escapeHtml($('#name').val()));
document.title = escapeHtml($('#name').val() + window.wizardTitleSuffix);
$frame.find('.footer_name').html(escapeHtml($('#name').val()));
$('#wesiteNameChange').val('changed');
}
if ( $eID == 'siteLogoImageStyle' ) {
var $website_name = $frame.find('.website-name.website-name-preview-helper');
$website_name.removeClass('website-name-active');
if ( $('#siteLogoImageStyle').val().length !== 0 ) {
$website_name.addClass($('#siteLogoImageStyle').val());
}
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
}
if ($eID=='home_custom_image_size') {
$frame.get(0).documentElement.style.setProperty('--home_custom_image_size', $('#home_custom_image_size').val()+'vh' );
}
if ($eID=='siteLogoStyle') {
$frame.find('.logo_name.logoStyle_1').removeClass('logoStyle_1');
$frame.find('.logo_name.logoStyle_2').removeClass('logoStyle_2');
$frame.find('.logo_name.logoStyle_3').removeClass('logoStyle_3');
$frame.find('.logo_name.logoStyle_4').removeClass('logoStyle_4');
$frame.find('.logo_name.logoStyle_5').removeClass('logoStyle_5');
$frame.find('.logo_name.logoStyle_6').removeClass('logoStyle_6');
$frame.find('.logo_name.logoStyle_7').removeClass('logoStyle_7');
$frame.find('.logo_name.logoStyle_8').removeClass('logoStyle_8');
$frame.find('.logo_name.logoStyle_9').removeClass('logoStyle_9');
$frame.find('.logo_name.logoStyle_10').removeClass('logoStyle_10');
$frame.find('.logo_name.logoStyle_11').removeClass('logoStyle_11');
$frame.find('.logo_name.logoStyle_12').removeClass('logoStyle_12');
$frame.find('.logo_name.logoStyle_13').removeClass('logoStyle_13');
$frame.find('.logo_name.logoStyle_14').removeClass('logoStyle_14');
$frame.find('.logo_name').addClass($('#siteLogoStyle').val());
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
$('#wesiteNameChange').val('changed');
}
if ($eID=='homepageAlternativeName' || $eID=='home_siteSlogan' || $eID=='home_siteSlogan_2' || $eID=='home_SecondSiteSlogan') {
if ($('#homepageAlternativeName').val().trim()!='') {
$frame.find('.homepageMenu').html(escapeHtml($('#homepageAlternativeName').val()));
} else {
$('#homepageAlternativeName').val('');
$frame.find('.homepageMenu').html(escapeHtml($('#homepageAlternativeName').attr('placeholder')));
}
if ($('#home_siteSlogan').val()!='') {
$frame.find('#home_siteSlogan').html(HomepageTextFormat(escapeHtml($('#home_siteSlogan').val())));
$frame.find('#home_siteSlogan').show();
} else {
$frame.find('#home_siteSlogan').hide();
}
if ($('#home_siteSlogan_2').val()!='') {
$frame.find('#home_siteSlogan_2').html(HomepageTextFormat(escapeHtml($('#home_siteSlogan_2').val())));
$frame.find('#home_siteSlogan_2').show();
} else {
$frame.find('#home_siteSlogan_2').hide();
}
if ($('#home_SecondSiteSlogan').val()!='') {
$frame.find('#home_SecondSiteSlogan').html(HomepageTextFormat(escapeHtml($('#home_SecondSiteSlogan').val())));
$frame.find('#home_SecondSiteSlogan').show();
} else {
$frame.find('#home_SecondSiteSlogan').hide();
}
if ( $('#home_siteSlogan').val().length === 0 || $('#home_SecondSiteSlogan').val().length === 0) {
$frame.find('.home-site-slogan-hr').hide();
} else {
$frame.find('.home-site-slogan-hr').show();
}
/**
* IMPORTANT - DONT'T active this line until fixing the way its works!
* At this moment its triggering all the preview ready, its not good and
* also its working any time the use typing, we need to build a unique ready
* event only for this (like the Parallax) and trigger only this event. We
* also need to add a delay so it will not run any time the user type.
*/
if (0) {
}
}
if ($eID=='home_text_size' || $eID=='home_text_size_2' || $eID=='slogan_text_size' || $eID=='home_text_size_weight' || $eID=='home_text_italic' || $eID=='home_text_size_2_weight' || $eID=='home_text_2_italic' || $eID=='slogan_text_size_weight'|| $eID=='slogan_text_italic' || $eID=='home_text_shadow_1' || $eID=='home_text_shadow_2' || $eID=='home_text_shadow_3' || $eID=='home_text_background_1' || $eID=='home_text_background_2' || $eID=='home_text_background_3' || $eID=='home_text_letter_spacing_1' || $eID=='home_text_letter_spacing_2' || $eID=='home_text_letter_spacing_3' || $eID=='home_text_word_spacing_1' || $eID=='home_text_word_spacing_2' || $eID=='home_text_word_spacing_3' || $eID=='home_text_line_height_1' || $eID=='home_text_line_height_2' || $eID=='home_text_line_height_3' || $eID=='home_text_bottom_space_1' || $eID=='home_text_bottom_space_2' || $eID=='home_text_bottom_space_3' || $eID=='home_text_rotate_1' || $eID=='home_text_rotate_2' || $eID=='home_text_rotate_3') {
$frame.get(0).documentElement.style.setProperty('--home_text_size_px', $('#home_text_size').val()+'px' );
$frame.get(0).documentElement.style.setProperty('--home_text_size', $('#home_text_size').val() );
$frame.get(0).documentElement.style.setProperty('--home_text_size_2_px', $('#home_text_size_2').val()+'px' );
$frame.get(0).documentElement.style.setProperty('--home_text_size_2', $('#home_text_size_2').val() );
$frame.get(0).documentElement.style.setProperty('--slogan_text_size_px', $('#slogan_text_size').val()+'px' );
$frame.get(0).documentElement.style.setProperty('--slogan_text_size', $('#slogan_text_size').val() );
$frame.find('#top-section h1').removeClass();
$frame.find('#top-section h2').removeClass();
$frame.find('#top-section p').removeClass();
$frame.find('#top-section h1').addClass($('#home_text_size_weight').val());
$frame.find('#top-section h1').addClass($('#home_text_italic').val());
$frame.find('#top-section h2').addClass($('#home_text_size_2_weight').val());
$frame.find('#top-section h2').addClass($('#home_text_2_italic').val());
$frame.find('#top-section p').addClass($('#slogan_text_size_weight').val());
$frame.find('#top-section p').addClass($('#slogan_text_italic').val());
$frame.find('#top-section h1').addClass($('#home_text_shadow_1').val());
$frame.find('#top-section h2').addClass($('#home_text_shadow_2').val());
$frame.find('#top-section p').addClass($('#home_text_shadow_3').val());
$frame.find('#top-section h1').addClass($('#home_text_letter_spacing_1').val());
$frame.find('#top-section h2').addClass($('#home_text_letter_spacing_2').val());
$frame.find('#top-section p').addClass($('#home_text_letter_spacing_3').val());
$frame.find('#top-section h1').css('letter-spacing',$('#home_text_letter_spacing_1').val()+'px');
$frame.find('#top-section h2').css('letter-spacing',$('#home_text_letter_spacing_2').val()+'px');
$frame.find('#top-section p').css('letter-spacing',$('#home_text_letter_spacing_3').val()+'px');
$frame.find('#top-section h1').css('word-spacing',$('#home_text_word_spacing_1').val()+'px');
$frame.find('#top-section h2').css('word-spacing',$('#home_text_word_spacing_2').val()+'px');
$frame.find('#top-section p').css('word-spacing',$('#home_text_word_spacing_3').val()+'px');
$frame.find('#top-section h1').css('transform','rotate('+$('#home_text_rotate_1').val()+'deg)');
$frame.find('#top-section h2').css('transform','rotate('+$('#home_text_rotate_2').val()+'deg)');
$frame.find('#top-section p').css('transform','rotate('+$('#home_text_rotate_3').val()+'deg)');
$frame.find('#top-section h1').css('line-height',''+$('#home_text_line_height_1').val()+'');
$frame.find('#top-section h2').css('line-height',$('#home_text_line_height_2').val());
$frame.find('#top-section p').css('line-height',$('#home_text_line_height_3').val());
$frame.find('#top-section h1').addClass($('#home_text_bottom_space_1').val());
$frame.find('#top-section h2').addClass($('#home_text_bottom_space_2').val());
$frame.find('#top-section p').addClass($('#home_text_bottom_space_3').val());
$frame.find('#top-section h1').css('margin-bottom',$('#home_text_bottom_space_1').val()+'px');
$frame.find('#top-section h2').css('margin-bottom',$('#home_text_bottom_space_2').val()+'px');
$frame.find('#top-section p').css('margin-bottom',$('#home_text_bottom_space_3').val()+'px');
$frame.find('#top-section h1').addClass($('#home_text_background_1').val());
$frame.find('#top-section h2').addClass($('#home_text_background_2').val());
$frame.find('#top-section p').addClass($('#home_text_background_3').val());
}
if ( $eID=='menu_font_size' || $eID=='logo_font_size' || $eID=='logo_text_size_weight' || $eID=='logo_text_italic' || $eID=='mobileMenuColor' || $eID=='mobileMenuFontSize' || $eID=='mobileMenuPagesSpace' ) {
$frame.find('#websiteHeader .moduleMenu a').css('font-size',Number($('#menu_font_size').val()));
$frame.find('#websiteHeader .navActions a, #websiteHeader .navActions button, #header .headerSocial a').css('font-size',Number($('#menu_font_size').val()));
$frame.find('#websiteHeader .logo_name,.website-name.website-name-preview-helper').css('font-size',Number($('#logo_font_size').val()));
$frame.find('#websiteHeader .logo_name,.website-name').removeClass('weight400 weight700');
$frame.find('#websiteHeader .logo_name,.website-name').addClass($('#logo_text_size_weight').val());
$frame.find('#websiteHeader .logo_name,.website-name').removeClass('italic');
$frame.find('#websiteHeader .logo_name,.website-name').addClass($('#logo_text_italic').val());
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
setTimeout(function() {
$frame.find('#websiteHeader .moduleMenu a').css('font-size',Number($('#menu_font_size').val()));
},200);
/**
* Mobile Menu Color - Font size, page spacing, text align
*/
$frame.get(0).documentElement.style.setProperty('--mobileMenuFontSize', $('#mobileMenuFontSize').val()+'px' );
$frame.get(0).documentElement.style.setProperty('--mobileMenuPagesSpace', $('#mobileMenuPagesSpace').val()+'px' );
if ( $eID == 'mobileMenuColor' ) {
/**
* Mobile Menu Color - Remove all classes that starts with namesapace `m-` because it is the mobile menu
* solution: https://stackoverflow.com/a/5182103
*/
$frame.find('#popupFloatDivMenu').removeClass(function (index, className) {
return (className.match (/(^|\s)m-\S+/g) || []).join(' ');
})
.addClass($('#mobileMenuColor').val());
$frame.find('.mobile-menu-btn').attr('data-menu-color',$('#mobileMenuColor').val());
}
if ( !document.getElementById('websitePreviewIframe') || ! document.getElementById('websitePreviewIframe').contentWindow ) {
return;
}
CheckMenuSizeAndMoreButton(tempNUM);
}
if ($eID=='logo_img_size') {
if (layoutArr[tempNUM].menuPlace=='left' || layoutArr[tempNUM].menuPlace=='right') {
$frame.find('.s123-site-logo > img').css({
'width':$('#logo_img_size').val()+'%',
'max-width':'100%',
'height':'auto'
});
}
if (layoutArr[tempNUM].menuPlace=='top' || layoutArr[tempNUM].menuPlace=='bottom') {
$frame.find('.s123-site-logo > img').css({
'width':'auto',
'height':$('#logo_img_size').val()+'%',
'max-height':'100%'
});
}
if ( !document.getElementById('websitePreviewIframe') || ! document.getElementById('websitePreviewIframe').contentWindow ) {
return;
}
CheckMenuSizeAndMoreButton(tempNUM);
}
if ( $eID == 'logo_text_letter_spacing' ) {
$frame.find('#websiteHeader .logo_name,.website-name').css('letter-spacing',Number($('#logo_text_letter_spacing').val()));
}
if ( $eID == 'logo_text_word_spacing' ) {
$frame.find('#websiteHeader .logo_name,.website-name').css('word-spacing',Number($('#logo_text_word_spacing').val()));
}
if ($eID=='home_opacity') {
$frame.find('#top-section .carousel, #top-section #video-bg, #top-section .home-image-bg, #parallax_home_opacity img').css('opacity',Number($('#home_opacity').val())*0.1);
$frame.find('#top-section .carousel, #top-section #video-bg, #top-section .home-image-bg').data('opacity',Number($('#home_opacity').val())*0.1);
}
if ($eID=='homepageFilterImage') {
$frame.find('#top-section .carousel, #top-section #video-bg, #top-section .home-image-bg, #parallax_home_opacity img').css('filter',$('#homepageFilterImage').val());
$frame.find('#top-section .carousel, #top-section #video-bg, #top-section .home-image-bg').data('filter',$('#homepageFilterImage').val());
}
if ($eID=='home_buttonText' || $eID=='home_buttonRedirect' || $eID=='home_buttonText_style') {
$frame.find('#home_buttonText').show().find('.h-b-t').html(escapeHtml($('#home_buttonText').val()));
$frame.find('#home_buttonText').removeClass('btn-primary-transparent btn-primary-white btn-primary-black');
if ($('#home_buttonText_style').val()=='2') {
$frame.find('#home_buttonText').addClass('btn-primary-transparent');
}
if ($('#home_buttonText_style').val()=='3') {
$frame.find('#home_buttonText').addClass('btn-primary-white');
}
if ($('#home_buttonText_style').val()=='4') {
$frame.find('#home_buttonText').addClass('btn-primary-black');
}
if ( $('#home_buttonText_type').val() == '1' ) {
$frame.find('#home_buttonText').removeAttr('href');
} else {
$frame.find('#home_buttonText').attr('href',$('#home_buttonRedirect').val() + '/?w=' + $('#id').val() );
}
}
if ($eID=='home_buttonText_1' || $eID=='home_buttonRedirect_1' || $eID=='home_buttonText_1_style') {
if ($('#home_buttonText_1').val()!='') {
$frame.find('#home_buttonText_1').show().find('.h-b-t').html(escapeHtml($('#home_buttonText_1').val()));
} else {
$frame.find('#home_buttonText_1').hide();
}
$frame.find('#home_buttonText_1').removeClass('btn-primary-transparent btn-primary-white btn-primary-black');
if ($('#home_buttonText_1_style').val()=='2') {
$frame.find('#home_buttonText_1').addClass('btn-primary-transparent');
}
if ($('#home_buttonText_1_style').val()=='3') {
$frame.find('#home_buttonText_1').addClass('btn-primary-white');
}
if ($('#home_buttonText_1_style').val()=='4') {
$frame.find('#home_buttonText_1').addClass('btn-primary-black');
}
if ( $('#home_buttonText_1_type').val() == '1' ) {
$frame.find('#home_buttonText_1').removeAttr('href');
} else {
$frame.find('#home_buttonText_1').attr('href',$('#home_buttonRedirect_1').val() + '/?w=' + $('#id').val() );
}
}
if ($eID=='topAction_buttonText_1' || $eID=='topAction_buttonText_1_style' || $eID=='topAction_buttonRedirect_1') {
if ($('#topAction_buttonText_1').val()!='') {
$frame.find('#topAction_buttonText_1').show().find('.m-b-t').html(escapeHtml($('#topAction_buttonText_1').val()));
} else {
$frame.find('#topAction_buttonText_1').hide();
}
$frame.find('#topAction_buttonText_1').removeClass('btn-primary-action-button-1').removeClass('btn-primary-action-button-2').removeClass('btn-primary-action-button-3').removeClass('btn-primary-action-button-4');
$frame.find('#topAction_buttonText_1').addClass('btn-primary-action-button-'+$('#topAction_buttonText_1_style').val());
CheckMenuSizeAndMoreButton(tempNUM);
}
if ($eID=='topAction_buttonText_2' || $eID=='topAction_buttonText_2_style' || $eID=='topAction_buttonRedirect_2') {
if ($('#topAction_buttonText_2').val()!='') {
$frame.find('#topAction_buttonText_2').show().find('.m-b-t').html(escapeHtml($('#topAction_buttonText_2').val()));
} else {
$frame.find('#topAction_buttonText_2').hide();
}
$frame.find('#topAction_buttonText_2').removeClass('btn-primary-action-button-1').removeClass('btn-primary-action-button-2').removeClass('btn-primary-action-button-3').removeClass('btn-primary-action-button-4');
$frame.find('#topAction_buttonText_2').addClass('btn-primary-action-button-'+$('#topAction_buttonText_2_style').val());
CheckMenuSizeAndMoreButton(tempNUM);
}
if ($eID=='layout_text_box_width') {
$frame.get(0).documentElement.style.setProperty('--layout_text_box_width', $('#layout_text_box_width').val()+'%' );
}
if ($eID=='layout_left_side_width') {
$frame.get(0).documentElement.style.setProperty('--layout_left_side_width', $('#layout_left_side_width').val()+'%' );
$frame.get(0).documentElement.style.setProperty('--layout_left_side_width_vh', $('#layout_left_side_width').val()+'vh' );
}
if ($eID=='layout_bottom_spacing') {
$frame.get(0).documentElement.style.setProperty('--layout_bottom_spacing', $('#layout_bottom_spacing').val()+'px' );
}
if ($eID=='homepage_goal_space') {
$frame.get(0).documentElement.style.setProperty('--homepage_goal_space', $('#homepage_goal_space').val()+'px' );
}
if ($eID=='homepage_second_goal_space') {
$frame.get(0).documentElement.style.setProperty('--homepage_second_goal_space', $('#homepage_second_goal_space').val()+'px' );
}
if ($eID=='homepage_layout_height') {
$frame.get(0).documentElement.style.setProperty('--homepage_layout_height', $('#homepage_layout_height').val()+'%' );
$frame.get(0).documentElement.style.setProperty('--homepage_layout_height_vh', $('#homepage_layout_height').val()+'vh' );
}
if ($eID=='homepageShapeDividerList_Size') {
$frame.get(0).documentElement.style.setProperty('--homepageShapeDividerList_Size', $('#homepageShapeDividerList_Size').val()+'%' );
}
if ($eID=='footer_layout') {
$frame.find('#footer_layout').val($('#footer_layout').val());
}
if ( $eID == 'embed_url_width_facebook' || $eID == 'embed_url_height_facebook' ) {
var $facebook_iframe = $frame.find('.homepage_goal iframe.facebook');
$facebook_iframe.width($('#embed_url_width_facebook').val());
$facebook_iframe.height($('#embed_url_height_facebook').val());
}
if ( $eID == 'embed_url_width_twitter' || $eID == 'embed_url_height_twitter' ) {
var $twitter_iframe = $frame.find('.homepage_goal iframe.twitter');
$twitter_iframe.width($('#embed_url_width_twitter').val());
$twitter_iframe.height($('#embed_url_height_twitter').val());
}
if ( $eID == 'embed_url_width_pinterest' || $eID == 'embed_url_height_pinterest' ) {
var $pinterest_iframe = $frame.find('.homepage_goal iframe.pinterest');
$pinterest_iframe.width($('#embed_url_width_pinterest').val());
$pinterest_iframe.height($('#embed_url_height_pinterest').val());
}
if ( $eID == 'embed_url_width_sound_cloud' || $eID == 'embed_url_height_sound_cloud' ) {
var $soundcloud_iframe = $frame.find('.homepage_goal iframe.sound_cloud');
$soundcloud_iframe.width($('#embed_url_width_sound_cloud').val());
$soundcloud_iframe.height($('#embed_url_height_sound_cloud').val());
}
if ( $eID == 'homepage_video_max_width' ) {
var $homepage_video_box = $frame.find('.homepage_goal > div');
$homepage_video_box.css({ maxWidth: $('#homepage_video_max_width').val()+'px' });
}
scrollToPointInPreview();
}
function HomepageTextFormat(text) {
text = HomepageTextFormatAction(text);
text = HomepageTextFormatAction(text);
text = HomepageTextFormatAction(text);
text = HomepageTextFormatAction(text);
text = HomepageTextFormatAction(text);
return text;
}
function HomepageTextFormatAction(text) {
text = text.replace(/\r\n|\r|\n/g,"<br/>")
text = text.replace(/\*\*([\s\S]*)\*\*/g, '<span class="mainWebsiteColor">$1</span>');
text = text.replace(/\*([\s\S]*)\*/g, '<span style="font-weight:bold;">$1</span>');
text = text.replace(/___([\s\S]*)___/g, '<span style="text-decoration:line-through;">$1</span>');
text = text.replace(/__([\s\S]*)__/g, '<span style="text-decoration:overline;">$1</span>');
text = text.replace(/_([\s\S]*)_/g, '<span style="text-decoration:underline;">$1</span>');
text = text.replace(/##([\s\S]*)##/g, '<span class="homepageRandomText" data-text="$1"></span>');
text = text.replace(/#([\s\S]*)#/g, '<span class="homepageRandomTextStop" data-text="$1"></span>');
return text;
}
function SetFontSizeByDevice(fontSize,screenWidth) {
var existingFontSizeNUM    = Number(fontSize);
var newFontSizeNUM         = existingFontSizeNUM;
if (existingFontSizeNUM>18) {
newFontSizeNUM = existingFontSizeNUM * (screenWidth / 1170);
}
return newFontSizeNUM;
}
function CheckMenuSizeAndMoreButton(tempNUM) {
if ( !Wizard.Preview.ready ) return;
if ( tempNUM == '9'
|| tempNUM == '1'
|| tempNUM == '10'
|| tempNUM == '2'
|| tempNUM == '5'
|| tempNUM == '13' ) {
Wizard.Preview.window.ReduseMenuSizeWhenWeDontHavePlace();
} else {
Wizard.Preview.window.ReduseMenuSizeWhenWeDontHavePlaceHeight();
}
}
/**
* The function update the preview iFrame module area using Ajax, instead
* of reloading the preview iframe.
*/
function UpdatePreviewModuleByAjax( moduleID, activeAjax ) {
if ( !moduleID ) return;
var url = '/?w=' + $('#id').val() +'&interfacePreviewAjax=1&interfacePreviewAjaxTag=section&interfacePreviewAjaxID=section-'+moduleID+'';
/**
* We check if the user inside a multi language preview,
* if so we like to reload the preview to the main language
* and then make the changes.
*/
if ( Wizard.Preview.ready && Wizard.Preview.window.multiLanCode != '' ) {
window.scrollPreview = '#section-'+moduleID;
PreviewWebsiteLanguage();
return;
}
if ( activeAjax ) {
previewLoadingMessage.show();
$.get( url, function( data ) {
var $frame = $('#websitePreviewIframe').contents();
var $currentModule =  $frame.find('#section-'+moduleID);
if ( $currentModule.length === 0 ) {
previewLoadingMessage.hide();
return;
}
var newModule = GetTagByIdUsingRegex('section',$currentModule[0].id,data);
if ( !newModule ) {
previewLoadingMessage.hide();
return;
}
/**
* Destroy the Parallax object to remove its mirrors that stays next to
* the `body` tag and related to the removed section tag. the Parallax will
* reinitialize automatically when we call to `.parallax('refresh')`.
*/
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.DestroyParallaxImages();
}
$currentModule.replaceWith(newModule);
var $moduleMenusAnchor = $frame.find('li[data-menu-module-id="'+moduleID+'"] a');
if ( $moduleMenusAnchor.length > 0 ) {
$moduleMenusAnchor.html(escapeHtml(GetModuleSetting(moduleID,'title')));
}
Preview_TriggerS123PageReadyAndLoad();
Wizard.refresh();
PreviewExternalLinksHandler();
/**
* Sort Preview Modules - We must sort the page because when the user is dragging
* a page, we start sorting them using Flexbox, so we add a CSS "order" property
* to each section. When the user edit a page we use Ajax and then the "order"
* property disappear. To fix this process we need to add a Style tag with CSS
* every time, then we can remove the call to this function.
*/
SortPreviewModules(false);
window.scrollPreview = '#section-'+moduleID;
scrollToPointInPreview();
previewLoadingMessage.hide();
});
} else {
window.scrollPreview = '#section-'+moduleID;
scrollToPointInPreview();
}
}
/**
* The function update an area on the preview iFrame using Ajax, instead
* of reloading the preview iFrame.
*
* @param {string/array} selectors - A selectors that point on the areas we like to update.
* @param {function} callback - A callback function to execute when the Ajax finished.
* @param {function} noLoading - True = Don't show loading on the preview iframe
*/
function UpdatePreviewAreaByAjax( selectors, callback, noLoading ) {
/**
* Structures Handler - When changing the structure its taking time for
* the browser to render the CSS. We didn't found any JavaScript event
* to detect when its finished rendering, so we add a timeout to prevent
* from the users see the CSS rendering process.
*/
var structuresHandler = false;
if ( selectors === 'structuresHandler' ) {
selectors = ['#websiteHeader','#top-section','footer.global_footer'];
structuresHandler = true;
}
if ( typeof selectors === 'string' ) selectors = selectors.split(",");
if (selectors.toString()=='#top-section') {
var url = '/?w=' + $('#id').val() +'&interfacePreviewAjax=1&interfacePreviewAjaxTag=section&interfacePreviewAjaxID=top-section';
} else {
if ( $.inArray( "#s123ModulesContainer", selectors ) !== -1 || 1 ) { //Still don't use the ELSE because some tool like PHONE and address use it
var url = '/?w=' + $('#id').val() +'&interfacePreviewAjax=1&interfacePreviewAjaxTag='+encodeURIComponent(selectors.toString())+'';
} else {
var url = '/?w=' + $('#id').val() +'&interfacePreviewAjax=1&interfacePreviewAjaxTag='+encodeURIComponent(selectors.toString())+'&interfacePreviewNoModulesAjax=1';
}
}
/**
* We check if the user inside a multi language preview,
* if so we like to reload the preview to the main language
* and then make the changes.
*/
if ( Wizard.Preview.ready && Wizard.Preview.window.multiLanCode != '' ) {
PreviewWebsiteLanguage();
return;
}
if ( !noLoading ) {
previewLoadingMessage.show(structuresHandler);
}
$.get( url, function( data ) {
var $frame = $('#websitePreviewIframe').contents();
Wizard.Preview.closePopups();
var $data  = $(data);
var videoTagFix = data.indexOf('<video') !== -1 ? true : false;
$(selectors).each( function( index, selector ) {
var $area = $frame.find(selector);
if ( $area.length === 0 ) return;
/**
* Destroy the Parallax object to remove its mirrors that stays next to
* the `body` tag and related to the removed section tag. the Parallax will
* reinitialize automatically when we call to `.parallax('refresh')`.
*/
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.DestroyParallaxImages();
}
if ( videoTagFix ) {
var pattern = /<video[^>]*autoplay[^>]*>/ig;
while (match = pattern.exec(data)) {
data = data.replace(match[0],match[0].replace(/autoplay/ig,'dataautop'));
}
}
var $f = $data.find(selector);
$area.replaceWith($f);
if ( videoTagFix ) {
$f.find('video[dataautop]').each(function() {
var $this = $(this);
$this.removeAttr('dataautop').attr('autoplay','true');
});
}
});
ReloadPreviewCSS(function() {
if ( !noLoading ) {
previewLoadingMessage.hide();
}
});
Wizard.refresh();
/**
* Sort Preview Modules - We must sort the page because when the user is dragging
* a page, we start sorting them using Flexbox, so we add a CSS "order" property
* to each section. When the user edit a page we use Ajax and then the "order"
* property disappear. To fix this process we need to add a Style tag with CSS
* every time, then we can remove the call to this function.
* Note: We must call `Wizard.refresh()` before we execute that function because
* we need to refresh the `Wizard.Preview.$modules` array.
*/
SortPreviewModules(false);
PreviewExternalLinksHandler();
/**
* When the user is refreshing the homepage slide show type we need to reinitialize the
* carousel so the images will keep working
*/
if ( selectors.indexOf('#top-section') != -1 && $('#homepage_style').val() == '3' ) {
Wizard.Preview.$('.home_background_wrapper').find('.carousel').carousel();
}
if ( callback ) callback();
});
}
/**
* The function handle the preview external links. We do not like the user to redirect
* from the wizard in case he clicks on an external link, submit button or other options.
*
* Note: To allow a link to be open add `data-allow-external-link="true"` to it.
*/
function PreviewExternalLinksHandler() {
var $frame = $('#websitePreviewIframe').contents();
var host = new RegExp('/' + window.location.host + '/');
$frame.find('a').not('[data-allow-external-link="true"]').each(function() {
if( this.href && !host.test(this.href) && this.href.toLowerCase() !== 'javascript:void(0);' ) {
$(this).off('click.previewExternalLinks').on('click.previewExternalLinks', function( event ) {
showMessage(event,this.href);
});
}
});
$frame.find('a[target="_parent"], a[target="_top"]').each(function() {
$(this).attr('target','_self');
});
$frame.find('form').each(function() {
if( this.action && !host.test(this.action)) {
$(this).off('submit.previewExternalLinks').on('submit.previewExternalLinks', function( event ) {
showMessage(event,this.action);
});
}
});
/**
* The function show the system external links message.
*/
function showMessage( event, link ) {
event.preventDefault();
event.stopPropagation();
bootbox.alert({
title: translations.previewExternalLinkTitle,
message: translations.previewExternalLinkMsg.replace('{{externalLink}}','<b>'+link+'</b>'),
className: 'externalAlert'
});
}
}
/**
* The function Trigger the SITE123 page ready & load custom event on the preview iFrame.
*/
function Preview_TriggerS123PageReadyAndLoad() {
var websitePreviewIframe = document.getElementById("websitePreviewIframe");
if ( websitePreviewIframe && websitePreviewIframe.contentWindow
&& websitePreviewIframe.contentWindow.TriggerS123PageReady ) {
websitePreviewIframe.contentWindow.TriggerS123PageReady();
websitePreviewIframe.contentWindow.TriggerS123PageLoad();
}
}
/**
* The function get the sent tag HTML according to the tag id
* attribute, and return it.
*/
function GetTagByIdUsingRegex(tag,id,html) {
return new RegExp("<" + tag + "[^>]*id[\\s]?=[\\s]?['\"]" + id + "['\"][\\s\\S]*?<\/" + tag + ">").exec(html);
}
function RefreshPreview() {
if ( isPreviewReload == false || viewButtonReload==true ) {
viewButtonReload = false;
return;
}
/**
* We check if the user inside a multi language preview,
* if so we like to reload the preview to the main language
* and then make the changes.
*/
if ( Wizard.Preview.ready && Wizard.Preview.window.multiLanCode != '' ) {
PreviewWebsiteLanguage();
return;
}
if ( g_ManageModuleID && g_ManageModuleID!='' ) {
ReloadPreviewAndGoToModule(g_ManageModuleID,true);
} else {
ReloadPreviewIframe('/?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
}
}
function PreviewWebsiteLanguage( languageCode ) {
if ( languageCode && languageCode.length !== 0 ) {
ReloadPreviewIframe('/t-'+languageCode+'?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
} else {
ReloadPreviewIframe('/?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
}
}
function PreviewModulePage(url) {
if ( url && url.length !== 0 ) {
ReloadPreviewIframe(url+'?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
} else {
ReloadPreviewIframe('/?w='+$('#id').val()+'&disableCache='+getRandomInt(0,9999999));
}
}
function isNumeric(n) {
return !isNaN(parseFloat(n)) && isFinite(n);
}
function ReloadPreviewAndGoToModule( moduleID, activeAjax ) {
var $module = $('#card_'+moduleID+'');
var moduleTypeNUM = $module.data('moduletypenum');
var systemModule = false;
if ( moduleTypeNUM == '78' ||  moduleTypeNUM == '108' ) return;
var reload = false;
/**
* System Modules - When the user is updating a system module (social, terms, etc.)
* we don't send his `moduleTypeNUM`, so we fix it here because the `moduleTypeNUM`
* is equal to the `moduleID` for system modules.
*/
if ( !isNumeric(moduleTypeNUM) ) {
moduleTypeNUM = moduleID;
systemModule = true;
}
/**
* Check if the module is a system module, if so we do not set the global
* module id for reloading the preview, instead of getting the content
* Using Ajax. e.g. Settings >> Social Networks >> Edit >> Close.
*/
if ( isNumeric(moduleTypeNUM) &&
modulesArr[Number(moduleTypeNUM)] &&
modulesArr[Number(moduleTypeNUM)]['module_kind'] &&
modulesArr[Number(moduleTypeNUM)]['module_kind'] == '2' ) {
if ( moduleTypeNUM == '115' ) {
UpdatePreviewAreaByAjax([
'#header-phone-content',
'#header-address',
'#s123ModulesContainer'
]);
return;
} else {
reload = true;
}
}
/**
* Single Page - Disable preview refresh via Ajax in case the user have a Single Page
* website, and the preview doesn't display the homepage.
*/
var disableAjaxRedirect = ( IsSinglePage() && !IsPreviewAtHomepage() );
if ( !reload && !disableAjaxRedirect && (IsSinglePage() || (IsPreviewAtHomepage() && $module.data('module-mp-show-in-home') == '1')) ) {
/**
* Global Contact As Handler - When updating the Contact As module we must also
* update the menu phone icon details, to do it we added this handler to the
* contact as module update process. Note: a global solution can be to add a new
* field to the `moduleArr` with selectors list we need to update, and if its set,
* we will update related to the those selectors.
*/
if ( activeAjax && moduleTypeNUM == '7' ) {
UpdatePreviewAreaByAjax([
'#header-phone-content',
'#header-address',
'#s123ModulesContainer'
],function() {
window.scrollPreview = '#section-'+moduleID;
scrollToPointInPreview();
});
/**
* E-commerce Handler - When closing the modal `#moduleWindow`
* after finishing with editing the module we need to make sure that
* the E-commerce menus and module section is updated
* so we use this function to refresh by Ajax the website preview.
*/
} else if ( activeAjax && moduleTypeNUM == '112' ) {
UpdatePreviewAreaByAjax([
'#mainNav ul.navPages',
'footer.global_footer ul.navPages',
'#section-'+moduleID
],function() {
window.scrollPreview = '#section-'+moduleID;
scrollToPointInPreview();
});
} else {
UpdatePreviewModuleByAjax(moduleID,activeAjax);
}
} else {
/**
* Preview Manager Buttons - When a user is in a module data page he got
* an Edit button that open the Edit Item page. We like to just reload the
* preview when the user close the Modal at this case so we added this fix,
* without it the system redirect the user to the module layout page.
*/
if ( $('#moduleWindow').data('opened-from-preview') ) {
$('#moduleWindow').data('opened-from-preview',false);
if ( Wizard.Preview.ready ) Wizard.Preview.window.location.reload();
return;
}
var homepageRedirect = false;
/**
* Check if the user like to show a module only at home-page, if so we
* redirect the user to homepage because this module is not having a page.
* Note: If the page is a child of a category we do not need to check its
* settings, because category must be display at list in one menu.
*/
if ( !GetModuleSetting(moduleID,'parentId') &&
GetModuleSetting(moduleID,'mp_showInMenu') == '0' &&
GetModuleSetting(moduleID,'showInFooter') == '0') {
homepageRedirect = true;
}
if ( isNumeric(moduleTypeNUM) &&
modulesArr[Number(moduleTypeNUM)] &&
modulesArr[Number(moduleTypeNUM)]['module_kind'] &&
modulesArr[Number(moduleTypeNUM)]['module_kind'] == '3' ) {
homepageRedirect = true;
}
/**
* Modules Without Pages - Some modules doesn't have a page
* (URL) so we must redirect the user to his homepage (e.g. Social).
*/
if ( moduleTypeNUM == '24' ) homepageRedirect = true;
/**
* Single page websites reload only to homepage, e.g. if a user made
* an order at the store from the preview, and he click on a page on
* the pages list, when he still at the order process, we need to redirect
* him to the displayed page on the homepage.
*/
if ( IsSinglePage() ) homepageRedirect = true;
if ( homepageRedirect ) {
if ( !systemModule ) window.scrollPreview = '#section-' + moduleID;
ReloadPreviewIframe( '/?w=' + $('#id').val() );
} else {
var url = '/' + GetModuleSetting(moduleID,'url') + '?w=' + $('#id').val();
if ( !activeAjax && Wizard.Preview.ready && Wizard.Preview.window.location.href.indexOf(url) !== -1 ) return;
ReloadPreviewIframe(url);
}
}
}
function SetHomepageModule(id, name) {
$('#homepage_goal').val(id);
SetHomepageGoal();
$('#homepage_goal').trigger('change');
$('#SetHomepageGoalWin').modal('hide');
}
function SetHomepageGoal() {
var homepage_goal = $('#homepage_goal').val();
var template = $('#template').val();
if ( template == '15' || template == '20' ) {
$('#homepageLayoutContainer').addClass('hidden');
$('#homepage_layout_height').val(100).trigger('change'); //The homepage need to be 100% from the screen
} else {
$('#homepageLayoutContainer').removeClass('hidden');
}
$('#home_secondary_background_color').closest('.form-group').addClass('hidden');
ShowHideTextLayoutElementsIfUnused();
if (homepage_goal=='12') {
$('#home_secondary_background_color').closest('.form-group').removeClass('hidden');
}
PrintTextLayouts();
}
/**
* The function is adding a orange flashing animation to the accordion that
* we want to show the user
*
* @param {string} id - Accordion id
*/
function ShowNewAccordiongInHomepageTab( id ) {
$('[data-id="'+id+'"]').addClass('orangeFlash');
setTimeout(function() {
$('[data-id="'+id+'"]').removeClass('orangeFlash');
},500);
}
/**
* the function show and hide the edit buttons of some options
* that we like to show them only if the option is active.
*/
function ShowEditButtonsOnActive() {
if ( !$("#showMailing").get(0).checked ) $("#showMailingEditButton").hide();
$("#showMailing").on('change', function() {
this.checked ? $("#showMailingEditButton").show() :$("#showMailingEditButton").hide();
});
if ( !$("#showSocial").get(0).checked ) $("#showSocialEditButton").hide();
$("#showSocial").on('change', function() {
this.checked ? $("#showSocialEditButton").show() :$("#showSocialEditButton").hide();
});
if ( !$("#showHeaderSocial").get(0).checked ) $("#showSocialEditButtonForHeader").hide();
$("#showHeaderSocial").on('change', function() {
this.checked ? $("#showSocialEditButtonForHeader").show() :$("#showSocialEditButtonForHeader").hide();
});
if ( !$("#showHeaderPhone").get(0).checked ) $("#collapseHeaderOptionsEnterPhoneNumber").hide();
$("#showHeaderPhone").on('change', function() {
this.checked ? $("#collapseHeaderOptionsEnterPhoneNumber").show() :$("#collapseHeaderOptionsEnterPhoneNumber").hide();
});
if ( !$("#showHeaderAddress").get(0).checked ) $("#collapseHeaderOptionsEnterAddress").hide();
$("#showHeaderAddress").on('change', function() {
this.checked ? $("#collapseHeaderOptionsEnterAddress").show() :$("#collapseHeaderOptionsEnterAddress").hide();
});
if ( !$("#showTerms").get(0).checked ) $("#showTermsEditButton").hide();
$("#showTerms").on('change', function() {
this.checked ? $("#showTermsEditButton").show() :$("#showTermsEditButton").hide();
});
if ( !$("#showPrivacy").get(0).checked ) $("#showPrivacyEditButton").hide();
$("#showPrivacy").on('change', function() {
this.checked ? $("#showPrivacyEditButton").show() :$("#showPrivacyEditButton").hide();
});
if ( !$("#showActionsButtons").get(0).checked ) $("#showActionsButtonsBOX").hide();
$("#showActionsButtons").on('change', function() {
if (this.checked) {
if ($('#topAction_buttonText_1').val()=='' && $('#topAction_buttonText_2').val()=='') {
$('#topAction_buttonText_1').val(translations.buttonOne).trigger('change');
}
$("#showActionsButtonsBOX").show();
} else {
$("#showActionsButtonsBOX").hide();
}
});
}
function getRandomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
function doneTyping () {
BuildToolJSON();
AutoSaveWizard(true,true);
}
function wizardTour() {
if (0) {
var tour = new Tour({
steps: [
{
element: "#wizardTab1button",
title: translations.Templates,
content: translations.TemplatesTabExplain
},{
element: "#wizardTab2button",
title: translations.Design,
content: translations.editHomepageText
},{
element: "#wizardTab4button",
title: translations.Pages,
content: translations.useReadyMadeModules
},{
element: "#wizardTab8button",
title: translations.Settings,
content: translations.settingsGeneral
},{
element: "#wizardTab9button",
title: translations.Domain,
content: translations.DomainTourExplain
},{
element: "#previewButtons",
title: translations.Preview,
content: translations.previewCheckLooks
},{
element: "#publishWebsiteButton",
title: translations.Publish,
content: translations.PublishChangeExp
}
],
template: "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><button type='button' class='btn btn-link btn-xs' data-role='prev'>« "+translations.Previous+"</button><span data-role='separator'> </span><button type='button' class='btn btn-success btn-xs' data-role='next'>"+translations.Next+" »</button><button type='button' class='btn btn-primary btn-xs' data-role='end'>"+translations.EndTour+"</button></div></div>",
backdrop: true,
onShown: function(tour) {
var getFocusEle = tour.getStep(tour.getCurrentStep()).element;
if ($('html[dir=rtl]').length>0) {
$('.tour-tour').css({
left: 'auto',
right: $(window).width()-$(getFocusEle).offset().left+'px'
});
$('.popover.right > .arrow').css({
left: 'auto',
right: '-11px',
display: 'none'
});
$('.popover[class*=tour-] .popover-navigation [data-role=end]').css({
float: 'left'
});
}
},
onHidden: function(tour) {
mixPanelEvent(false,"Wizard - User Close Tour");
}
});
}
if (abTest_v1=='tour3' || abTest_v1=='tour4') {
if (abTest_v1=='tour3') {
var voiceOver = '';
}
if (abTest_v1=='tour4') {
var voiceOver = '_v2';
}
var tour = new Tour({
steps: [
{
element: "#wizardTab2button",
title: translations.Homepage,
content: translations.editHomepageText + '<div class="media" data-title="'+translations.Homepage+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage.jpg?v=2"></div>'
},{
element: "#wizardTab4button",
title: translations.Pages,
content: translations.useReadyMadeModules + '<div class="media" data-title="'+translations.Pages+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages.jpg?v=2"></div>'
},{
element: "#wizardTab6button",
title: translations.Design,
content: translations.designCustomize + '<div class="media" data-title="'+translations.Design+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design.jpg?v=2"></div>'
},{
element: "#wizardTab8button",
title: translations.Settings,
content: translations.settingsGeneral + '<div class="media" data-title="'+translations.Settings+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings.jpg?v=2"></div>'
},{
element: "#wizardTab9button",
title: translations.Domain,
content: translations.DomainTourExplain + '<div class="media" data-title="'+translations.Domain+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain.jpg?v=2"></div>'
},{
element: "#previewButtons",
title: translations.Preview,
content: translations.previewCheckLooks + '<div class="media" data-title="'+translations.Preview+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview.jpg?v=2"></div>'
},{
element: "#publishWebsiteButton",
title: translations.Publish,
content: translations.PublishChangeExp + '<div class="media" data-title="'+translations.Publish+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish.jpg?v=2"></div>'
}
],
template: "<div class='popover tour tour3'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div><button type='button' class='btn btn-default btn-sm' data-role='end'>"+translations.EndTour+"</button></div><div><button type='button' class='btn btn-link btn-sm' data-role='prev'>« "+translations.Previous+"</button><button type='button' class='btn btn-primary btn-sm' data-role='next'>"+translations.Next+" »</button></div></div></div>",
backdrop: true,
onShown: function(tour) {
var getFocusEle = tour.getStep(tour.getCurrentStep()).element;
if ($('html[dir=rtl]').length>0) {
$('.tour-tour').css({
left: 'auto',
right: $(window).width()-$(getFocusEle).offset().left+'px'
});
$('.popover.right > .arrow').css({
left: 'auto',
right: '-11px',
display: 'none'
});
$('.popover[class*=tour-] .popover-navigation [data-role=end]').css({
float: 'left'
});
}
$('.popover.tour.tour3').find('.media').click(function() {
var $this = $(this);
ShowTourVideoExplain($this.data('title'),$this.data('video'),$this.data('image-preview'));
});
},
onHidden: function(tour) {
mixPanelEvent(false,"Wizard - User Close Tour");
}
});
}
if ( abTest_v1=='wizardV4' || abTest_v1=='wizardV_beta'|| abTest_v1=='wizardV_beta_V1' || abTest_v1=='wizardV_beta_V2' ) {
if ( abTest_v1=='wizardV4' || abTest_v1=='wizardV_beta'|| abTest_v1=='wizardV_beta_V1' || abTest_v1=='wizardV_beta_V2' ) {
var voiceOver = '_v2';
}
/**
* Bootstrap Tour Initialize
* Documentation: http://bootstraptour.com/api/
*/
var wizardTour = new Tour({
steps: [
{
element: "#wizardTab2button",
title: translations.Homepage,
content: translations.editHomepageText + '<div class="media" data-title="'+translations.Homepage+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage_beta_tour_v1.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage.jpg?v=2"></div>'
},{
element: "#wizardTab4button",
title: translations.Pages,
content: translations.useReadyMadeModules + '<div class="media" data-title="'+translations.Pages+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages.jpg?v=2"></div>'
},{
element: "#wizardTab6button",
title: translations.Design,
content: translations.designCustomize + '<div class="media" data-title="'+translations.Design+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design.jpg?v=2"></div>'
},{
element: "#wizardTab8button",
title: translations.Settings,
content: translations.settingsGeneral + '<div class="media" data-title="'+translations.Settings+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings.jpg?v=2"></div>'
},{
element: "#wizardTab9button",
title: translations.Domain,
content: translations.DomainTourExplain + '<div class="media" data-title="'+translations.Domain+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain.jpg?v=2"></div>'
},{
element: "#previewButtons",
title: translations.Preview,
content: translations.previewCheckLooks + '<div class="media" data-title="'+translations.Preview+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview.jpg?v=2"></div>'
},{
element: "#publishWebsiteButton",
title: translations.Publish,
content: translations.PublishChangeExp + '<div class="media" data-title="'+translations.Publish+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish'+voiceOver+'.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish.jpg?v=2"><img src="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish.jpg?v=2"></div>'
}
],
template : function(tour) {
var html = '';
html += "<div class='popover tour tour3'>";
html += "<div class='arrow'></div>";
html += "<button type='button' class='close' style='opacity:1;' aria-label='Close' data-role='end'><span aria-hidden='true'><i class='ace-icon fa fa-times red2'></i></span></button>";
html += "<h3 class='popover-title'></h3>";
html += "<div class='popover-content'></div>";
html += "<div class='popover-navigation'>";
html += "<div style='width:100%;display:flex;justify-content:flex-end;'>";
html += "<button type='button' class='btn btn-link btn-sm' data-role='prev'>« "+translations.Previous+"</button>";
if ( wizardTour._options.steps.length === (wizardTour.getCurrentStep() + 1) ) {
html += "<button type='button' class='btn btn-primary btn-sm' data-role='end'>"+translations.Finish+"</button>";
} else {
html += "<button type='button' class='btn btn-primary btn-sm' data-role='next'>"+translations.Next+" »</button>";
}
html += "</div>";
html += "</div>";
html += "</div>";
return html;
},
backdrop: true,
onShown: function(tour) {
if ( $('html[dir=rtl]').length > 0 ) {
var getFocusEle = tour.getStep(tour.getCurrentStep()).element;
$('.tour-tour').css({
left: 'auto',
right: $(window).width()-$(getFocusEle).offset().left+'px'
});
$('.popover.right > .arrow').css({
left: 'auto',
right: '-11px',
transform: 'scale(-1, 1)'
});
}
$('.popover.tour.tour3').find('.media').click(function() {
var $this = $(this);
ShowTourVideoExplain($this.data('title'),$this.data('video'),$this.data('image-preview'));
});
},
onHidden: function(tour) {
mixPanelEvent(false,"Wizard - User Close Tour");
}
});
}
wizardTour.restart();
}
/**
* The function is showing the single video tour every time the user is clicking on the
* video tutorial links / images
*
* @pararm {string} title - Popup Title
* @pararm {string} video - Tutorial video
* @pararm {string} imagePreview - Tutorial video preview image
*/
function ShowTourVideoExplain( title, video, imagePreview ) {
var bootMessage = '';
bootMessage += '<div class="s-v-e">';
bootMessage += '<div class="hidden-xs">';
bootMessage += '<ul class="side-tabs list-group">';
bootMessage += '<li class="list-group-item" data-title="'+translations.Homepage+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage_beta_tour_v1.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/homepage.jpg?v=2">';
bootMessage += '<i class="fa fa-home"></i>';
bootMessage += '<span>'+translations.Homepage+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Pages+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/pages.jpg?v=2">';
bootMessage += '<i class="fa fa-tasks"></i>';
bootMessage += '<span>'+translations.Pages+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Design+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/design.jpg?v=2">';
bootMessage += '<i class="fa fa-paint-brush"></i>';
bootMessage += '<span>'+translations.Design+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Settings+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/settings.jpg?v=2">';
bootMessage += '<i class="fa fa-cog"></i>';
bootMessage += '<span>'+translations.Settings+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Domain+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/domain.jpg?v=2">';
bootMessage += '<i class="fa fa-globe"></i>';
bootMessage += '<span>'+translations.Domain+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Preview+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/preview.jpg?v=2">';
bootMessage += '<i class="fa fa-desktop"></i>';
bootMessage += '<span>'+translations.Preview+'</span>';
bootMessage += '</li>';
bootMessage += '<li class="list-group-item" data-title="'+translations.Publish+'" data-video="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish_v2.mp4?v=2" data-image-preview="'+$GLOBALS['cdn-system-files']+'/files/wizardTour/publish.jpg?v=2">';
bootMessage += '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bullhorn" class="svg-inline--fa fa-bullhorn fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0-23.63-12.95-44.04-32-55.12V32.01C544 23.26 537.02 0 512 0c-7.12 0-14.19 2.38-19.98 7.02l-85.03 68.03C364.28 109.19 310.66 128 256 128H64c-35.35 0-64 28.65-64 64v96c0 35.35 28.65 64 64 64h33.7c-1.39 10.48-2.18 21.14-2.18 32 0 39.77 9.26 77.35 25.56 110.94 5.19 10.69 16.52 17.06 28.4 17.06h74.28c26.05 0 41.69-29.84 25.9-50.56-16.4-21.52-26.15-48.36-26.15-77.44 0-11.11 1.62-21.79 4.41-32H256c54.66 0 108.28 18.81 150.98 52.95l85.03 68.03a32.023 32.023 0 0 0 19.98 7.02c24.92 0 32-22.78 32-32V295.13C563.05 284.04 576 263.63 576 240zm-96 141.42l-33.05-26.44C392.95 311.78 325.12 288 256 288v-96c69.12 0 136.95-23.78 190.95-66.98L480 98.58v282.84z"></path></svg>';
bootMessage += '<span>'+translations.Publish+'</span>';
bootMessage += '</li>';
bootMessage += '</ul>';
bootMessage += '</div>';
bootMessage += '<div class="message">';
bootMessage += '<iframe style="display: block;color:white;width:100%;height:100%;" type="text/html" src="' + '/include/globalVideoPlayerInterface.php?url=' + encodeURIComponent(video) +'&poster=' + encodeURIComponent(imagePreview) + '&autoplay=true" frameborder="0" allowfullscreen=""></iframe>';
bootMessage += '</div>';
bootMessage += '</div>';
var $bootMessage = $(bootMessage);
var $iframe = $bootMessage.find('iframe');
setActiveTab(title);
$bootMessage.find('.side-tabs li').on('click.change_video', function( event ) {
event.preventDefault();
var $this = $(this);
$iframe.attr('src','/include/globalVideoPlayerInterface.php?url=' + encodeURIComponent($this.data('video')) +'&poster=' + encodeURIComponent($this.data('image-preview')) + '&autoplay=false');
$iframe.one('load', function() {
$bootMessage.find('.message').fadeIn(200);
});
$bootMessage.find('.message').fadeOut(200,function() {
setActiveTab($this.data('title'));
});
$('.singleVideoExplain .modal-header h4').html($(this).data('title'));
});
bootbox.dialog({
title: title,
message: $bootMessage,
backdrop: true,
closeButton: true,
onEscape: true,
blurBackground: '.popover.tour.tour3',
size: 'x-large',
className: 'bootbox_promoteModal singleVideoExplain tutorial'
});
Wizard.userActions.logAction('flag_OpenTutorialVideo',false);
/**
* The function is adding active class to the selected tab
*
* @pararm {string} title - Selected tab title
*/
function setActiveTab( title ) {
$bootMessage.find('.side-tabs > li').removeClass('active');
$bootMessage.find('.side-tabs li[data-title="'+title+'"]').addClass('active');
}
}
/**
* The function is showing the example videos in a popup window
*
* @param {string} title - Popup title
* @param {string} video - Video path
* @param {string} imagePreview - Video preview image path
* @param {string} className - Additional class name for design or more things
*/
function ShowTourWelcomeVideoExplain( title, video, imagePreview, className ) {
var bootMessage = '<div class="message">';
bootMessage += '<video style="width: 100%;height:auto;" controls autoplay poster="'+imagePreview+'"><source src="'+video+'" type="video/mp4"></video>';
bootMessage += '</div>';
bootbox.dialog({
title: title,
message: bootMessage,
backdrop: true,
closeButton: true,
onEscape: true,
blurBackground: '.main-container',
size: 'x-large',
className: 'bootbox_promoteModal singleVideoExplain ' + className
});
}
function WizardLoadError() {
bootbox.alert({
title: translations.Warning,
message: 'The wizard does not load properly, please try to load it again'
});
}
function MakeSureWizardReadyToGo() {
if ($('input#home_start_image').length>0) {
wizardReadyToGo = true;
}
}
function ResetButtonsScrollSectionList( $select ) {
if ( tools_manage.length === 0 || $select.length === 0 ) return;
var modules = jQuery.parseJSON(tools_manage);
var selectedValue = $select.val() ? $select.val() : '1';
$select.find("option").remove();
var place = 1;
var promoCount = 1;
$.each(modules, function( index, module ) {
var moduleTitle = module.title;
if ( !module.moduleTypeNUM ) module.moduleTypeNUM = module.toolID;
if ( !IsSinglePage() && module.mp_showInHome != '1' ) return;
if ( module.moduleTypeNUM == '78' ) return;
if ( module.moduleTypeNUM == '108' ) return;
if ( module.moduleTypeNUM == '1000' ) {
moduleTitle = translations.Promo + ' ' + promoCount;
promoCount++;
}
if ($select.attr('id')=='topAction_buttonText_1_scrollSection' || $select.attr('id')=='topAction_buttonText_2_scrollSection') {
$select.append($('<option>', {
value: module.moduleID,
text : moduleTitle
}));
} else {
$select.append($('<option>', {
value: place,
text : moduleTitle
}));
}
place += 1;
});
$select.val(selectedValue);
}
/**
* The function get the active plugins list and add
* `Edit` button for each plugin.
**/
function GetActivePlugins() {
var request = $.post(
'/versions/'+versionNUM+'/wizard/plugins/activePluginsAjex.php', {
w : websiteID,
}).done(function( data ) {
if ( data.length != 0) {
$('#activePluginList').html(data);
} else {
$('#activePluginList').empty();
}
});
}
/**
* The function get the active languages list
**/
function GetActiveLanguages() {
if ($('#activeLanguagesList').length>0) {
var request = $.post(
'/versions/'+versionNUM+'/wizard/languagesManager/activeLanguagesAjax.php', {
w : websiteID,
}).done(function( data ) {
if ( data.length != 0) {
$('#activeLanguagesList').html(data);
ManageLanguageButtonActiveEvent();
$('#language').parents('.form-group').addClass('disableBox');
$('#language').parents('.col-xs-12').attr('data-rel', 'tooltip');
$('#language').parents('.col-xs-12').attr('title', 'You can\'t change website language until you remove the extra languages in your website');
$('#language').parents('.col-xs-12').tooltip('enable');
$('#countryFlagCode_box').show();
} else {
$('#activeLanguagesList').empty();
$('#language').parents('.form-group').removeClass('disableBox');
$('#language').parents('.col-xs-12').removeAttr('title');
$('#language').parents('.col-xs-12').removeAttr('data-rel');
$('#language').parents('.col-xs-12').tooltip('disable');
$('#countryFlagCode_box').hide();
}
});
}
}
/**
* The function check if a website type is Single Page.
**/
function IsSinglePage() {
return $('input[name=onepage]:checked').val() == '1';
}
/**
* The function check if the preview iFrame is at the website homepage.
**/
function IsPreviewAtHomepage() {
if ( !Wizard.Preview.ready ) return false;
return Wizard.Preview.$('html.home_page').length === 1;
}
function OpenModuleManagmentWizardFromPreview(moduleID,moduleTypeNUM,itemID) {
OpenModuleWindow(moduleID,moduleTypeNUM,itemID,false);
$('#moduleWindow').data('opened-from-preview',true);
$('#moduleWindow').modal('show');
SetEnlargeWindow(moduleTypeNUM);
}
/**
* The function show and hide the preview loading message.
*/
var previewLoadingMessage = new function() {
var container = $('#previewBox');
var template = '<div id="previewLoadingMessage"><i class="ace-icon fa fa-spinner fa-spin white fa-5x"></i></div>';
var exist = $('#websitePreviewIframe').length !== 0;
/**
* The function show the loading message.
*/
this.show = function( structuresHandler ) {
if ( !exist ) return;
if ( !this.loading ) this.loading = $(template).appendTo(container);
if ( structuresHandler ) this.loading.addClass('structuresHandler');
};
/**
* The function hide the loading message.
*/
this.hide = function() {
if ( !exist ) return;
if ( !this.loading ) return;
var that = this;
/**
* Structures Handler - When changing the structure its taking time for
* the browser to render the CSS. We didn't found any JavaScript event
* to detect when its finished rendering, so we add a timeout to prevent
* from the users see the CSS rendering process.
*/
if ( that.loading.hasClass('structuresHandler') ) {
setTimeout(function() {
if ( !that.loading ) return;
that.loading.remove();
that.loading = false;
/* if the user has changed a ready template there will be a loading
icon so we need to remove it after the loading has finished */
if ( $('.chooseUniqueStyle').data('template-change-in-progress') ) {
$('.chooseUniqueStyle').trigger('style_change',false);
}
},2000);
} else {
that.loading.remove();
that.loading = false;
}
};
};
function SendUserToDashboard(url) {
disableLeavePopup = true;
location.href = url;
}
/**
* The function handle the website background image setting.
*/
function WebsiteBackgroundImageHandler() {
var $website_background_color_image = $('#website_background_color_image');
var $website_background_type = $('#website_background_type');
var $website_background_color = $('#website_background_color');
$website_background_color_image.on('change',function( event, s3Obj ) {
if ( $website_background_color_image.val() !== '' ) {
if ( !s3Obj ) return;
if ( !$.isNumeric(s3Obj.w) ) return;
if ( parseInt(s3Obj.w) >= 1920 ) {
$website_background_type.val('cover');
} else {
$website_background_type.val('repeat');
}
if ( s3Obj.i_d_c ) {
$website_background_color.spectrum('set',s3Obj.i_d_c[0].hex);
}
}
hideOrShowBgColor();
});
/**
* The function hide or show the website background color setting. When the user
* is uploading a website background image the system automatically choose its background
* color, so we hide the settings from the user, and we show it if he remove the image.
*/
function hideOrShowBgColor() {
if ( $website_background_color_image.val() !== '' ) {
$website_background_color.closest('.form-group').hide();
} else {
$website_background_color.closest('.form-group').show();
}
}
}
/**
* Wizard Class.
*/
var Wizard = function() {
var Wizard = {};
/**
* Wizard Initialize.
*/
Wizard.init = function() {
Wizard.Tabs.init();
Wizard.Pages.init();
Wizard.Tips.init();
Wizard.bootstrapMultiModalHandler();
Wizard.userActions.init({
userActions: userActions
});
};
/**
* The function refresh the Wizard Class.
* There are some actions that changed the DOM, in those cases
* we need to refresh for updating the wizard objects with the
* new DOM elements.
*/
Wizard.refresh = function() {
Wizard.Pages.refresh();
Wizard.Preview.refresh();
}
/**
* Bootstrap Multi Modal Handler - In some cases we open modal from another
* modal, in this case we like to `backdrop` to hide also the parent modal.
* The issue is that BS doesn't add a related id/class to the related modal
* `backdrop` element. So we do it from here to handle it.
*/
Wizard.bootstrapMultiModalHandler = function() {
$(document).on('shown.bs.modal', function ( event ) {
var $modal = $(event.target);
$('.modal-backdrop.in:not([id])').attr('id',$modal.get(0).id+'_backdrop');
});
}
return Wizard;
}();
/**
* Wizard Tabs Class.
*/
Wizard.Tabs = function() {
var Tabs = {};
Tabs.logo = {};
Tabs.home = {};
Tabs.pages = {};
Tabs.design = {};
Tabs.settings = {};
Tabs.domain = {};
/**
* Wizard Tabs Initialize.
*/
Tabs.init = function() {
Tabs.logo.t = $('#wizardTab0button');
Tabs.home.t = $('#wizardTab2button');
Tabs.pages.t = $('#wizardTab4button');
Tabs.pages.addNewPageModule = $('#addNewPageModule');
Tabs.design.t = $('#wizardTab6button');
Tabs.settings.t = $('#wizardTab8button');
Tabs.domain.t = $('#wizardTab9button');
Tabs.events.init();
};
/**
* Events
*/
Tabs.events = {
/**
* Initialize all the events the page need to handle when it ready.
*/
init : function() {
Tabs.pages.t.on('click.Wizard.Tabs', function( event ) {
Tabs.pages.setAddNewPagePosition();
FitWizardTextToBox()
});
$(window).resize(function() {
Tabs.pages.setAddNewPagePosition();
});
}
};
/**
* The function set the Add New Page button position.
*/
Tabs.pages.setAddNewPagePosition = function() {
Tabs.pages.addNewPageModule.css({
width : $('#pagesTab').width(),
left : $('#pagesTab').offset().left
});
};
return Tabs;
}();
/**
* Wizard Pages Class.
*/
Wizard.Pages = function() {
var Pages = {};
/**
* Pages Initialize.
*/
Pages.init = function() {
Pages.homepage = $('#card_homepage');
Pages.list = $('#sortable li');
Pages.events.init();
};
/**
* Events
*/
Pages.events = function() {
var E = {};
/**
* Initialize all the events the page need to handle when it ready.
*/
E.init = function() {
Pages.homepage.off('click.wizardPages').on('click.wizardPages', function( event ) {
Pages.highlight.on(Pages.homepage);
Wizard.Preview.closePopups();
if ( !IsPreviewAtHomepage() ) {
isPreviewReload = true;
RefreshPreview();
} else {
window.scrollPreview = Wizard.Preview.$homepage;
scrollToPointInPreview();
}
});
Pages.list.each(function( index ) {
var $page = $(this);
$page.find('.boxClick, .pages_dragButton').off('click.wizardPages').on('click.wizardPages', function( event ) {
event.stopPropagation();
Wizard.Pages.highlight.on($page);
Wizard.Preview.closePopups();
ReloadPreviewAndGoToModule($page.data('moduleid'),false);
});
});
}
return E;
}();
/**
* The function highlight the sent wizard page.
*
* @param {object} $page - A wizard page object.
*/
Pages.highlight = function() {
var H = {};
/**
* The function highlight the sent wizard page.
* @param {object} $page - A wizard page object.
*/
H.on = function( $page ) {
H.off();
$page.addClass('p-active');
};
/**
* The function remove highlight from all the wizard pages.
*/
H.off = function() {
if ( !Pages.list || Pages.list.length === 0 ) return;
Pages.list.filter('.p-active').removeClass('p-active');
Pages.homepage.removeClass('p-active');
};
return H;
}();
/**
* The function scroll the wizard pages list to the sent page.
*
* @param {object} $page - A wizard page object.
*/
Pages.scrollTo = function( $page ) {
var $scrollParent = $page.scrollParent();
var offset = -180;
$scrollParent.scrollTop($page.position().top - $("#sortable").offset().top + offset);
};
/**
* The function get a page related to the sent page id.
*
* @param {string} id - The page id.
*/
Pages.getPage = function( id ) {
return $('#card_'+id);
};
/**
* Refresh - At this moment we do not have anything different
* to refresh then we do on `init()`, but please call the refresh in all
* the places. The `init()` need to called only one time when the page
* is ready. In the future this function will be different from the `init()`.
*/
Pages.refresh = function() {
Pages.init();
}
return Pages;
}();
/**
* Wizard Preview Class.
*/
Wizard.Preview = function() {
var Preview = {};
/**
* Initialize
*/
Preview.init = function() {
Preview.iframe = $('#websitePreviewIframe');
if ( Preview.iframe.length === 0 ) return;
Preview.window = Preview.iframe.get(0).contentWindow;
Preview.$ = Preview.window.$;
if ( !Preview.$ ) return;
Preview.$window = Preview.$(Preview.window);
Preview.$document = Preview.$(Preview.window.document);
Preview.iframe.contents = Preview.iframe.contents();
Preview.$homepage = Preview.$('#top-section');
Preview.$modules = Preview.$('section.s123-module, section.s123-page-data');
Preview.buttonsHighlight();
Preview.setReady();
};
/**
* The function set a flag that set if the Preview Class is ready.
*/
Preview.setReady = function() {
Preview.ready = true;
Preview.$window.off('unload.wizardPreview');
Preview.$window.on('unload.wizardPreview', function( event ) {
Preview.ready = false;
});
};
/**
* The function highlight the preview manage buttons when
* clicking on a module in the preview IFrame.
*
* @param {object} $module - Module object.
*/
Preview.buttonsHighlight = function() {
highlight(Preview.$homepage);
Preview.$modules.each(function( index ) {
/* we use `Preview.$` to get the document context. we need it to work
with the preview iframe jQuey instance instead), e.g. $obj.popover
will use the preview iframe popover instead of the wizard popover. */
highlight(Preview.$(this));
});
/**
* The function handle the highlight actions.
*/
function highlight( $module ) {
if ( $module.length === 0 ) return;
$module.off('click.wizardPreview');
$module.on('click.wizardPreview', function( event ) {
var $btn = $module.find('.previewManageButton');
var $a = $btn.find('> a');
var pageId = $module.get(0).id;
if ( $module.get(0).id === 'top-section' ) {
pageId = 'homepage';
} else {
pageId = $module.get(0).id.replace('section-','');
}
var $page = Wizard.Pages.getPage(pageId);
Wizard.Pages.scrollTo($page);
Wizard.Pages.highlight.on($page);
if ( $a.hasClass('p-m-b-flash') ) return;
if ( $btn.find(event.target).length !== 0 ) return;
$a.addClass('p-m-b-flash');
$(document).trigger('s123.previewManageButtonFlash',[$btn]);
});
}
}
/**
* The function get a module related to the sent module id.
*
* @param {string} id - The module id.
*/
Preview.getModule = function( id ) {
return Preview.$modules.filter('#section-'+id);
};
/**
* The function close all the preview pop-ups.
*/
Preview.closePopups = function() {
if ( !Wizard.Preview.ready ) return;
Preview.window.buildPopup_CloseAllPopupsInPage();
if ( Preview.window.$.magnificPopup ) {
Preview.window.$.magnificPopup.close();
}
};
/**
* Refresh - At this moment we do not have anything different
* to refresh then we do on `init()`, but please call the refresh in all
* the places. The `init()` need to called only one time when the page
* is ready. In the future this function will be different from the `init()`.
*/
Preview.refresh = function() {
Preview.init();
}
/**
* Redirect Object - The object responsible on redirecting the wizard preview
* to pages we need, e.g. homepage, module page, item page, etc.
*/
Preview.Redirect = function() {
var R = {};
/**
* The function redirect the wizard preview to the sent item id data page.
* @param {integer} websiteID - Website id.
* @param {integer} moduleID - Module id.
* @param {integer} moduleTypeNUM - Module type id.
* @param {integer} itemID - Item id (optional - default will redirect to the first item).
*/
R.toItem = function( websiteID, moduleID, moduleTypeNUM, itemID ) {
if ( !Preview.ready ) return;
if ( !itemID ) itemID = 'first_item';
Preview.window.location = '/versions/'+versionNUM+'/wizard/modules/wizard.preview.redirect.php?' + jQuery.param( { websiteID: websiteID, moduleID: moduleID, moduleTypeNUM: moduleTypeNUM, itemID: itemID } );
};
return R;
}();
/**
* Scale Object - Some users use small screen resolutions on desktop devices,
* so we need to Scale the preview on those cases, for the users to see the
* desktop version of there website, instead of Table/Mobile version. To do
* so we build the Scale object.
*/
Preview.Scale = function() {
var S = {};
S.initialized = false;
/**
* Initialize.
*/
S.init = function() {
S.$previewBox = $('#previewBox');
S.$iframe = $('#websitePreviewIframe');
S.preview_16_9 = false; // window.screen.availWidth >= 1920;
S.showButtonsToolbar = true;
if ( S.$iframe.length === 0 ) return;
if ( S.initialized ) S.destroy();
S.$previewBox.addClass('no-transition');
S.addDevicesButtons();
S.$dButtons.$desktop.trigger('click',['scale_init']);
S.initialized = true;
if ( S.showButtonsToolbar ) {
S.$previewBox.addClass('type-16-9');
S.$dButtons.$container.addClass('p-16-9');
S.$iframe.addClass('p-16-9');
S.$previewBox.addClass('p-16-9');
S.$previewBox.prepend(S.$dButtons.$container);
S.$dButtons.$dropdown.closest('#preview-devices-buttons').addClass('hidden');
}
};
/**
* Initialize Reset
*/
S.reset = function() {
S.$previewBox = $('#previewBox');
S.$iframe = $('#websitePreviewIframe');
S.addDevicesButtons();
};
/**
* The function add a Devices Buttons that let the user an option to choose
* in what resolution he likes to display the preview Mobile, Tablet, etc.
*/
S.addDevicesButtons = function() {
S.$dButtons = {};
S.$dButtons.$container = $('#previewScaleDevices');
S.$dButtons.$dropdown = $('#previewButtons');
S.$dButtons.$mobile = S.$dButtons.$container.find('.p-d-btn-mobile');
S.$dButtons.$tablet = S.$dButtons.$container.find('.p-d-btn-tablet');
S.$dButtons.$desktop = S.$dButtons.$container.find('.p-d-btn-desktop');
if ( S.$dButtons.$container.length === 0
|| S.$dButtons.$dropdown.length === 0
|| S.$dButtons.$mobile.length === 0
|| S.$dButtons.$tablet.length === 0
|| S.$dButtons.$desktop.length === 0 ) {
throw 'Preview.Scale - Missing settings on initialize!';
}
S.$dButtons.$container.find('.p-d-btn').off('click').click(function() {
var $btn = $(this);
S.$dButtons.$dropdown.find('i').attr('class',$btn.find('i').attr('class'));
S.$dButtons.$dropdown.attr('data-prev-active',$btn.data('device-width'));
if ( $btn.hasClass('p-d-btn-desktop') ) {
S.$dButtons.$dropdown.data('active-btn','desktop');
} else if ( $btn.hasClass('p-d-btn-tablet') ) {
S.$dButtons.$dropdown.data('active-btn','tablet');
} else if ( $btn.hasClass('p-d-btn-mobile') ) {
S.$dButtons.$dropdown.data('active-btn','mobile');
}
S.$dButtons.$container.find('.p-d-btn').removeClass('active');
$btn.addClass('active');
S.set($btn.data('device-width'));
if ( Wizard.Preview.ready ) {
if ( $btn.hasClass('p-d-btn-tablet') || $btn.hasClass('p-d-btn-mobile') ) {
Wizard.Preview.window.Parallax_active(false);
} else {
Wizard.Preview.window.Parallax_active(true);
}
}
});
S.$dButtons.$container.show();
};
/**
* The function set the device resolution and Scale the preview if needed.
*
* @param {integer} deviceWidth - The device resolution we like to set.
*/
S.set = function( deviceWidth ) {
if ( S.preview_16_9 ) {
var border_spacing = parseInt(Wizard.Preview.Scale.$iframe.css('border-width')) * 2;
var buttons_toolbar_height = $('#previewScaleDevices').outerHeight(true);
var horizontal_spacing_offset = 40;
var vertical_spacing_offset = 60;
var iframe_width = null;
var iframe_height = null;
/**
* 16/9 Desktop Preview - Calculate the 16/9 size of the preview only for desktop preview
*/
if ( S.$dButtons.$desktop.hasClass('active') ) {
if ( (S.$previewBox.width() / (16/9)) > S.$previewBox.height() ) {
var iframe_width = (S.$previewBox.height() - vertical_spacing_offset) * (16/9);
var iframe_height = (S.$previewBox.height() - vertical_spacing_offset - buttons_toolbar_height);
} else {
var iframe_width = (S.$previewBox.width() - horizontal_spacing_offset);
var iframe_height = (S.$previewBox.width() - horizontal_spacing_offset - buttons_toolbar_height) / (16/9);
}
/**
* Normal Preview Size Mobile/ Tablet - Set the size of the preview for the selected device
* Note: On the height we subtract 58 pixels because of the new top preview bar and the iframe border
* (Top preview bar height 43px + margin bottom 5px = 48px) + (Iframe top border 5px + Iframe bottom border 5px = 10px)
*/
} else {
iframe_width = deviceWidth;
iframe_height = S.$previewBox.height() - 58;
}
S.rate = iframe_width / deviceWidth;
if ( S.rate >= 1.0 ) {
S.$iframe.css({
width: iframe_width + border_spacing,
height: iframe_height + border_spacing,
margin: '0 auto',
display: 'block',
top: '',
left: '',
transform: '',
position: 'static',
});
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
return;
}
S.$iframe.css({
width: deviceWidth + border_spacing,
height: iframe_height + border_spacing,
transform: 'scale('+S.rate+')',
position: 'absolute'
});
/**
* Centered Iframe Issue - At the past we calculate the top & left to center the
* preview iframe related to its parent, now we do it with flex, if there is no
* bugs we can remove that calculations if there is we need to remove the
* `#previewBox.p-16-9 { align-items: center;}` and return that calculations.
*/
if ( 0 ) {
var scaled_calculated_16_9_height = iframe_height * S.rate;
var scaled_centered_top = (S.$previewBox.height() - scaled_calculated_16_9_height) / 2;
var scaled_centered_left = (S.$previewBox.width() - iframe_width ) / 2;
/**
* When scaling on element the browser push it to the top & left related to
* the scale rate. So we reset the top & left and calculate them again using
* jQuery `position()` to place the element where we like.
*/
S.$iframe.css({
top: 0,
left: 0
}).css({
top: scaled_centered_top + (S.$iframe.position().top * -1),
left: scaled_centered_left + (S.$iframe.position().left * -1)
});
}
} else {
var buttons_toolbar_height = $('#previewScaleDevices').outerHeight(true);
var border_spacing = S.getBorderWidth(Wizard.Preview.Scale.$iframe);
var horizontal_spacing_offset = 40;
var bottom_spacing_offset = 20;
var iframe_width = null;
var iframe_height = null;
S.rate = S.$previewBox.width() / deviceWidth;
if ( S.rate > 1.0 ) {
if ( S.$dButtons.$desktop.hasClass('active') ) {
iframe_width = 'calc(100% - '+horizontal_spacing_offset+'px)';
} else {
iframe_width = deviceWidth + border_spacing;
}
iframe_height = S.$previewBox.height() - buttons_toolbar_height - bottom_spacing_offset;
S.$iframe.css({
width: iframe_width,
height: iframe_height,
display: 'block',
transform: '',
top: '',
left: '',
position: 'static',
});
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
return;
}
iframe_width = deviceWidth - horizontal_spacing_offset + border_spacing;
iframe_height = (S.$previewBox.height() - buttons_toolbar_height - bottom_spacing_offset) * ( 1 / S.rate );
S.$iframe.css({
width: iframe_width,
height: iframe_height,
transform: 'scale('+S.rate+')',
transformOrigin: 'top',
position: 'static'
});
/**
* Centered Iframe Issue - At the past we calculate the top & left to center the
* preview iframe related to its parent, now we do it with flex, if there is no
* bugs we can remove that calculations if there is we need to remove the
* `#previewBox.p-16-9 { align-items: center;}` and return that calculations.
*/
if ( 0 ) {
/**
* When scaling on element the browser push it to the top & left related to
* the scale rate. So we reset the top & left and calculate them again using
* jQuery `position()` to place the element where we like.
*/
S.$iframe.css({
top: 0,
left: 0
}).css({
top: buttons_toolbar_height + (S.$iframe.position().top * -1),
left: (horizontal_spacing_offset / 2) + (S.$iframe.position().left * -1)
});
}
}
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
};
/**
* The function calculate the border width and return it.
*/
S.getBorderWidth = function( $element ) {
return Wizard.Preview.Scale.$iframe.outerWidth() - Wizard.Preview.Scale.$iframe.innerWidth();
};
/**
* The function recalculate the preview scale settings related to
* the last selected device resolution. We need to call it when
* we change the preview size or screen size.
*/
S.refresh = function() {
if ( !S.initialized ) return;
S.set(S.$dButtons.$container.find('.p-d-btn.active').data('device-width'));
};
/**
* The function recalculate the preview scale settings related to
* the last selected device resolution. We need to call it when
* we change the preview size or screen size.
*/
S.destroy = function() {
S.$dButtons.$container.hide();
S.$iframe.css({
width: '',
height: '',
margin: '',
display: '',
top: '',
left: '',
transform: '',
position: '',
});
S.initialized = false;
};
return S;
}();
return Preview;
}();
/**
* Wizard Color Palettes.
*/
Wizard.colorPalettes = function() {
var that = {
$theme_style : $('#theme_style'),
$styleThemesColorPalettesBox : $('#styleThemesColorPalettesBox')
};
/**
* Wizard Color Palettes.
*/
that.init = function() {
if ( that.$theme_style.length === 0 || that.$styleThemesColorPalettesBox === 0 ) return;
that.generateColorPalettes();
};
/**
* The function generate the wizard color palettes.
*/
that.generateColorPalettes = function() {
var display = {
amount: 11,
counter: 0,
$morePalettesBtn: function() {
var $btn = $('<div class="theme-item"><div class="colorCircle theme-more-palettes-btn"><i class="fa fa-plus"></i></div></div>');
$btn.click(function() {
display.$morePalettesBox.slideToggle(400,function() {
if ( display.$morePalettesBox.is(':visible') ) {
$btn.find('i').switchClass('fa-plus','fa-minus');
} else {
$btn.find('i').switchClass('fa-minus','fa-plus');
}
});
});
return $btn;
},
$morePalettesBox: $('<div class="theme-more-palettes-box"><div class="theme-more-palettes-list"></div></div>')
}
$.each(style_themes,function( theme_id , theme ) {
theme = tryParseJSON(theme);
var $theme_item = $('<div class="theme-item"><div class="colorCircle" style="background-color:'+theme.global_main_color+';"></div></div>');
if ( that.$theme_style.val() === theme_id ) that.activeTheme($theme_item);
$theme_item.click(function() {
that.$theme_style.val(theme_id);
themeStyleChange();
that.activeTheme($theme_item);
that.$theme_style.trigger('change');
});
if ( display.counter === display.amount ) {
that.$styleThemesColorPalettesBox.append(display.$morePalettesBtn);
that.$styleThemesColorPalettesBox.append(display.$morePalettesBox);
}
if ( display.counter >= display.amount ) {
display.$morePalettesBox.children('.theme-more-palettes-list').append($theme_item);
} else {
that.$styleThemesColorPalettesBox.append($theme_item);
}
display.counter++;
});
};
/**
* The function active the sent theme.
*/
that.activeTheme = function( $theme_item ) {
that.$styleThemesColorPalettesBox.children('.theme-item.active').removeClass('active');
$theme_item.addClass('active');
};
return that;
}();
/**
* Websites Notification Plugin
*/
Wizard.Notification = (function() {
var Notification = {
rtl: ($('html[dir=rtl]').length !== 0 ? true : false),
isMobile: ($('html[data-device="mobile"]').length !== 0 ? true : false),
milliseconds: 30000
};
var hideUpgradeCountdowntime = false;
/**
* Initialize
*/
Notification.init = function( $container ) {
var $n = $('<div class="wizard-website-notification"></div>');
$n.counters = {
notification: $('#notificationsPopoverContent .li-no-new-notification'),
forms: $('#notificationsPopoverContent .n-p-c-form-messages .counter'),
store: $('#notificationsPopoverContent .n-p-c-store .counter'),
articles: $('#notificationsPopoverContent .n-p-c-articles .counter'),
blog: $('#notificationsPopoverContent .n-p-c-blog .counter'),
mailingList: $('#notificationsPopoverContent .n-p-c-mailing-list .counter'),
events: $('#notificationsPopoverContent .n-p-c-events .counter'),
jobs: $('#notificationsPopoverContent .n-p-c-jobs .counter'),
pricing: $('#notificationsPopoverContent .n-p-c-pricing .counter'),
donate: $('#notificationsPopoverContent .n-p-c-donate .counter'),
scheduleBooking: $('#notificationsPopoverContent .n-p-c-schedule-booking .counter'),
restaurantReservations: $('#notificationsPopoverContent .n-p-c-restaurant-reservations .counter'),
foodDelivery: $('#notificationsPopoverContent .n-p-c-food-delivery .counter'),
eCommerce: $('#notificationsPopoverContent .n-p-c-e-commerce .counter'),
eCommerce_review: $('#notificationsPopoverContent .n-p-c-e-commerce-review .counter')
};
Notification.popover.init();
if ( Notification.isMobile) $n.css({width: 17, height: 17, top: -11, left: -7, fontSize: 10, padding:'0px 0px 1px 4px' });
if ( Notification.rtl ) $n.css({ left: 'auto', right: $n.css('left'), padding:'0px 3px 1px 4px' });
$container.css({ position: 'relative' }).append($n);
Notification.update();
Notification.interval = setInterval(Notification.update,Notification.milliseconds);
Notification.$n = $n;
Notification.$container = $container;
};
/**
* The function count the notification number and sent it to a callback function.
*/
Notification.count = function( callback ) {
if (userActive_isActive==false) return;
if ( !$.isNumeric($('#id').val()) ) return;
$.post( '/versions/'+versionNUM+'/wizard/include/websiteNotifications.php', {
w: $('#id').val(),
type: 'total'
}).done( function( data ) {
if ( data == 'Login Error' ) {
userNotConnectedMessage();
return;
}
try {
data = JSON.parse(data);
} catch (e) {}
if ( !data || typeof data !== "object" ) return;
callback.call(this,data[0]);
Notification.constructUpgradeButton(data[1]);
addDiscountToUpgradeModal(websiteID,data[1]);
});
}
/**
* The function is creating the upgrade button with a counter
*/
Notification.constructUpgradeButton = function(data) {
$('#discountButton').remove();
if ( data.saleReducedNUM == 0 || data.saleExpiry == '' || hideUpgradeCountdowntime == true ) return;
var html = '';
html  = '<div id="discountButton">';
html += '<div id="discountButtonHide">X</div>';
html += '<button id="discountButtonButton" type="button" class="btn btn-danger wizardMainButton no-radius" data-toggle="modal" data-target="#discountPackage">';
html += '<div><span>'+translations.DiscountOFF.replace('{{discount_percentage}}',data.saleReducedNUM)+'</span></div>';
html += '<div id="saleExpiry" style="font-size:12px;color:yellow;">'+data.saleExpiry+'</div>';
html += '</button>';
html += '</div>';
$(html).insertBefore('#upgradeButton');
$('#discountButtonButton').tooltip({
container: 'body',
placement: 'auto'
});
$('#discountButtonButton').on('click',function(){
$('#upgradeButtonButton').trigger('click');
});
$('#discountButtonButton').on('mouseenter',function(){
$('#discountButtonHide').show();
});
$('#discountButtonHide').on('click',function(){
$('#discountButton').hide();
hideUpgradeCountdowntime = true;
});
$("#saleExpiry").countdown(ConvertUtcToLocalTime($("#saleExpiry").html()), function(event) {
var totalHours = event.offset.totalDays * 24 + event.offset.hours;
$(this).html(event.strftime(totalHours + ':%M:%S'));
});
FitWizardTextToBox();
}
/**
* The function update the notifications number.
*/
Notification.update = function( callback ) {
Notification.count( function( data ) {
/**
* parse the JSON response, we using `try` and `catch` to prevent JS
* error if the JSON isn't valid from some reason (e.g. logout user).
*/
try {
data = JSON.parse(data);
} catch (e) {}
if ( !data || typeof data !== "object" ) return;
/**
* Update websites notifications and we display the new notification in
* the popover only if the user have notification in the same tool .
*/
if ( $.isNumeric(data.forms) ) {
if ( data.forms != 0 ) {
Notification.$n.counters.forms.html('+'+data.forms);
Notification.$n.counters.forms.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.forms.closest('li').addClass('hidden');
Notification.$n.counters.forms.html(0);
}
}
if ( $.isNumeric(data.products) ) {
if ( data.products != 0 ) {
Notification.$n.counters.store.html('+'+data.products);
Notification.$n.counters.store.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.store.closest('li').addClass('hidden');
Notification.$n.counters.store.html(0);
}
}
if ( $.isNumeric(data.articles) ) {
if ( data.articles != 0 ) {
Notification.$n.counters.articles.html('+'+data.articles);
Notification.$n.counters.articles.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.articles.closest('li').addClass('hidden');
Notification.$n.counters.articles.html(0);
}
}
if ( $.isNumeric(data.blog) ) {
if ( data.blog != 0 ) {
Notification.$n.counters.blog.html('+'+data.blog);
Notification.$n.counters.blog.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.blog.closest('li').addClass('hidden');
Notification.$n.counters.blog.html(0);
}
}
if ( $.isNumeric(data.mailingList) ) {
if ( data.mailingList != 0 ) {
Notification.$n.counters.mailingList.html('+'+data.mailingList);
Notification.$n.counters.mailingList.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.mailingList.closest('li').addClass('hidden');
Notification.$n.counters.mailingList.html(0);
}
}
if ( $.isNumeric(data.events) ) {
if ( data.events != 0 ) {
Notification.$n.counters.events.html('+'+data.events);
Notification.$n.counters.events.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.events.closest('li').addClass('hidden');
Notification.$n.counters.events.html(0);
}
}
if ( $.isNumeric(data.jobs) ) {
if ( data.jobs != 0 ) {
Notification.$n.counters.jobs.html('+'+data.jobs);
Notification.$n.counters.jobs.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.jobs.closest('li').addClass('hidden');
Notification.$n.counters.jobs.html(0);
}
}
if ( $.isNumeric(data.pricing) ) {
if ( data.pricing != 0 ) {
Notification.$n.counters.pricing.html('+'+data.pricing);
Notification.$n.counters.pricing.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.pricing.closest('li').addClass('hidden');
Notification.$n.counters.pricing.html(0);
}
}
if ( $.isNumeric(data.donate) ) {
if ( data.donate != 0 ) {
Notification.$n.counters.donate.html('+'+data.donate);
Notification.$n.counters.donate.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.donate.closest('li').addClass('hidden');
Notification.$n.counters.donate.html(0);
}
}
if ( $.isNumeric(data.scheduleBooking) ) {
if ( data.scheduleBooking != 0 ) {
Notification.$n.counters.scheduleBooking.html('+'+data.scheduleBooking);
Notification.$n.counters.scheduleBooking.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.scheduleBooking.closest('li').addClass('hidden');
Notification.$n.counters.scheduleBooking.html(0);
}
}
if ( $.isNumeric(data.restaurantReservations) ) {
if ( data.restaurantReservations != 0 ) {
Notification.$n.counters.restaurantReservations.html('+'+data.restaurantReservations);
Notification.$n.counters.restaurantReservations.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.restaurantReservations.closest('li').addClass('hidden');
Notification.$n.counters.restaurantReservations.html(0);
}
}
if ( $.isNumeric(data.foodDelivery) ) {
if ( data.foodDelivery != 0 ) {
Notification.$n.counters.foodDelivery.html('+'+data.foodDelivery);
Notification.$n.counters.foodDelivery.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.foodDelivery.closest('li').addClass('hidden');
Notification.$n.counters.foodDelivery.html(0);
}
}
if ( $.isNumeric(data.eCommerce) ) {
if ( data.eCommerce != 0 ) {
Notification.$n.counters.eCommerce.html('+'+data.eCommerce);
Notification.$n.counters.eCommerce.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.eCommerce.closest('li').addClass('hidden');
Notification.$n.counters.eCommerce.html(0);
}
}
if ( $.isNumeric(data.eCommerce_review) ) {
if ( data.eCommerce_review != 0 ) {
Notification.$n.counters.eCommerce_review.html('+'+data.eCommerce_review);
Notification.$n.counters.eCommerce_review.closest('li').removeClass('hidden');
} else {
Notification.$n.counters.eCommerce_review.closest('li').addClass('hidden');
Notification.$n.counters.eCommerce_review.html(0);
}
}
if ( !$.isNumeric(data.total) ) return;
if ( data.total != 0 ) {
Notification.$n.counters.notification.addClass('hidden');
Notification.$n.text(data.total).show(600);
} else {
Notification.$n.counters.notification.removeClass('hidden');
Notification.$n.hide(600);
}
});
}
/**
* Notifications popover
*/
Notification.popover = {
$btn : $('#wizardTab0button'),
$content : $('#notificationsPopoverContent'),
/**
* Notifications popover initialize
*/
init: function() {
/**
* Bootstrap's Popovers Plugin Initial
* Documentation : http://getbootstrap.com/javascript/#popovers
*/
Notification.popover.$btn.popover({
container: 'body',
title: translations.Notifications,
content: Notification.popover.$content,
html: true,
trigger: 'manual',
template: '<div class="popover wizard-notification"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><h3 class="popover-footer"><a id="returnToDash" onclick="SendUserToDashboard(\'/versions/'+versionNUM+'/wizard/dashboard.php?w='+websiteID+'\');">'+translations.ReturnToDashboard+'</a></h3></div>',
placement: intrface_align_reverse
});
Notification.popover.$btn.on('shown.bs.popover', function () {
$('.popover.modules-setting [data-rel=tooltip]').tooltip({
container: 'body',
placement: 'auto'
});
$(document).on('mousedown.notificationsPopover', function ( event ) {
if ( $(event.target).closest(Notification.popover.$btn).length !== 0 ) return;
if ( $(event.target).closest('.popover.wizard-notification').length === 0 ) {
Notification.popover.hide();
}
});
$(window).one('blur.notificationsPopover', function( event ) {
Notification.popover.hide();
});
});
Notification.popover.$btn.on('click', function( event ) {
if ( Notification.popover.$btn.data('p-o-open') ) {
Notification.popover.hide();
return;
}
Notification.popover.show();
});
},
/**
* Display the notifications popover
*/
show: function() {
Notification.popover.$btn.data('p-o-open',true);
Notification.popover.$btn.popover('show');
},
/**
* Hide the notifications popover
*/
hide: function() {
Notification.popover.$btn.data('p-o-open',false);
Notification.popover.$btn.popover('hide');
$(document).off('mousedown.notificationsPopover');
$(window).off('blur.notificationsPopover');
$(window).off('scroll.notificationsPopover');
}
};
return Notification;
})();
/**
* Wizard Tips Class.
*/
Wizard.Tips = function() {
var Tips = {};
/**
* Tips initialize.
*/
Tips.init = function() {
Tips.user_tips = user_tips;
Tips.list.dragPages();
Tips.list.previewManageButtons();
};
/**
* Show Object - The object show the tip to the user.
*/
Tips.Show = {
/**
* The function show the tip in a popover.
*/
popover: function( opt ) {
var $window = opt.$window ? opt.$window : $(window);
var $document = opt.$document ? opt.$document : $(document);
var $tip = opt.$tip;
var $target_element = opt.$target_element;
var placement = opt.placement ? opt.placement : intrface_align_reverse;
if ( $tip.length === 0 || $target_element.length === 0 ) return;
/**
* Bootstrap's Popovers Plugin Initial
* Documentation : https://getbootstrap.com/docs/3.4/javascript/#popovers
*/
$target_element.popover({
container: 'body',
content: $tip,
html: true,
trigger: 'manual',
template: '<div class="popover user-tips-popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
placement: placement
});
$target_element.popover('show');
$target_element.on('shown.bs.popover', function ( event ) {
$tip.find('[data-tip-dismiss="popover"]').click(function( event ) {
destroy();
});
$document.on('mousedown.destroyPopover', function ( event ) {
if ( $(event.target).closest('.user-tips-popover').length === 0 ) {
destroy();
}
});
/*
$window.one('blur.destroyPopover', function( event ) {
destroy();
});
$window.one('scroll.destroyPopover', function( event ) {
destroy();
});
*/
});
/**
* The function destroy the popover and removes event handlers that were attached to it
*/
function destroy() {
Tips.setAsRead($tip);
$target_element.popover('destroy');
$document.off('mousedown.destroyPopover');
$window.off('blur.destroyPopover');
$window.off('scroll.destroyPopover');
}
}
};
/**
* The function set a tip as read.
*/
Tips.setAsRead = function( $tip ) {
if ( $tip.length === 0 ) return;
$.post( '/manager/user_tips/update_tip.php', {
tip_type: $tip.data('tip-type')
});
};
/**
* The function check if the sent tip is already ready and return true if so.
*/
Tips.isReaded = function( $tip_type ) {
return Tips.user_tips[$tip_type] ? true : false;
};
/**
* Tips initialize.
*/
Tips.list = {
/**
* The function initialize the drag pages tab tip.
*/
dragPages: function() {
var tip_type = 'dragPages';
if ( Tips.isReaded(tip_type) ) return;
$(document).one('s123.wizardPageAdded',function( event ) {
var tip_html = '';
tip_html += '<div data-toggle="s123_user_tips" data-tip-type="'+tip_type+'" class="alert alert-block alert-warning">';
tip_html += '<p>';
tip_html += '<span>'+translations.tips_PagesTabDrag+'</span>';
tip_html += '</p>';
tip_html += '<p>';
tip_html += '<button class="btn btn-sm btn-warning" data-tip-dismiss="popover">'+translations.tips_UnderstandBtn+'</button>';
tip_html += '</p>';
tip_html += '</div>';
setTimeout(function() {
Tips.Show.popover({
$tip: $(tip_html),
$target_element: Wizard.Pages.list.last().find('.pages_dragButton')
});
},3000);
});
},
/**
* The function initialize the preview manage buttons tip.
*/
previewManageButtons: function() {
var tip_type = 'previewManageButtons';
if ( Tips.isReaded(tip_type) ) return;
$(document).on('s123.wizardTips.previewManageButtonFlash',function( event, $previewManageButton ) {
if ( Wizard.Preview.$window.scrollTop() > $previewManageButton.offset().top ) return;
var tip_html = '';
tip_html += '<div data-toggle="s123_user_tips" data-tip-type="'+tip_type+'" class="alert alert-block alert-warning">';
tip_html += '<p>';
tip_html += '<span>'+translations.tips_PreviewManageButtons+'</span>';
tip_html += '</p>';
tip_html += '<p>';
tip_html += '<button class="btn btn-sm btn-warning" data-tip-dismiss="popover">'+translations.tips_UnderstandBtn+'</button>';
tip_html += '</p>';
tip_html += '</div>';
Tips.Show.popover({
$window: Wizard.Preview.$window,
$document: Wizard.Preview.$document,
$tip: Wizard.Preview.$(tip_html),
$target_element: $previewManageButton,
placement: Wizard.Preview.$('html').attr('dir') === 'ltr' ? 'left' : 'right'
});
$(document).off('s123.wizardTips.previewManageButtonFlash');
});
}
};
return Tips;
}();
/**
* Homepage Background Options Class
*/
Wizard.homePageBgOptions = new function() {
var that = this;
/**
* The method is initializing the object
*/
that.init = function( settings ) {
if ( !settings ) return;
that.$container = settings.$container;
that.$popUpContainer = settings.$popUpContainer;
that.$popUpContainer.append(generatePopUpHTML());
that.popUp = that.$popUpContainer.find('.r-i-modal');
that.backDrop = that.$popUpContainer.find('.r-i-back-drop');
libraryCategoriesOutput(that.$container.find('#RecommendedImagesHomepage'),libraryHomepageArr);
libraryCategoriesOutput(that.popUp.find('#rcContainer'),libraryHomepageArr[0].items);
addPluginAbilities();
};
/**
* The method is responsible for showing the pop up
*
* @param {string} type - Popup type ( categories, images, colors )
*/
that.showPoUp = function( type ) {
that.type = type;
that.popUp.off('show.bs.modal').on('show.bs.modal', function() {
that.backDrop.show();
hidePopUpTools();
if ( type == 'colors' ) {
showPopUpTools(['#ActiveHomepageColor','.colorsContainer']);
that.popUp.find('.modal-title').text(translations.homepageRI.typeColorTitle);
that.popUp.find('#homepageGradientsColorsList').empty();
addColorsListToPoUp(that.popUp.find('#homepageGradientsColorsList'),false);
/* When the user is opening a color library we need to show him the custom colors options but originally they are
in the filter setting box so we change the parents*/
$("#home_background_color_BOX").detach().appendTo('.customColorBOX');
$("#home_text_color_BOX").detach().appendTo('.customColorBOX');
} else if ( type == 'gradients' ) {
showPopUpTools(['.colorsContainer']);
that.popUp.find('.modal-title').text(translations.homepageRI.typeGradientsTitle);
that.popUp.find('#homepageGradientsColorsList').empty();
addColorsListToPoUp(that.popUp.find('#homepageGradientsColorsList'),true);
/* When the user is opening a color library we need to show him the custom colors options but originally they are
in the filter setting box so we change the parents*/
$("#home_background_color_BOX").detach().appendTo('.customColorBOX');
$("#home_text_color_BOX").detach().appendTo('.customColorBOX');
} else if ( type == 'all' ) {
showPopUpTools(['.search-container','#rcContainer']);
that.popUp.find('.modal-title').text(translations.homepageRI.typeCategoriesTitle);
} else if ( type == 'patterns' ) {
showPopUpTools(['#RecommendedImagesContainer']);
that.popUp.find('.modal-title').text(translations.homepageRI.typePatternsTitle);
searchImagesByQuery();
} else {
showPopUpTools(['.search-container','#RecommendedImagesContainer']);
that.popUp.find('.modal-title').text(translations.homepageRI.typeImagesTitle);
searchImagesByQuery();
}
}).off('shown.bs.modal').on('shown.bs.modal', function() {
resizeElment(that.popUp.find('#rcContainer .boxContent'));
}).off('hide.bs.modal').on('hide.bs.modal', function() {
that.popUp.find('.search').val('');
that.backDrop.hide();
}).off('hidden.bs.modal').on('hidden.bs.modal', function() {
$("#home_background_color_BOX").detach().appendTo('#home_background_color_BOX_block');
$("#home_text_color_BOX").detach().appendTo('#home_text_color_BOX_block');
that.popUp.find('#RecommendedImagesContainer').hide();
that.popUp.find('.colorsContainer').hide();
that.popUp.find('#rcContainer').hide();
if ( that.popUp.find('#ActiveHomepageColor').hasClass('active') ) {
that.popUp.find('.customColorHeader').trigger('click');
}
});
that.popUp.modal('show');
};
/**
* The method returning the recommended images by page number
*
* @param {integer} pageNUM - Page number
*/
that.getRecommendedImages = function( pageNUM ) {
if ( that.q == '' ) return;
if ( pageNUM == 1 ) {
recommendedImagesLoading_start = false;
$('#RecommendedImages').html('');
$('#RecommendedImages').height(50);
}
if ( recommendedImagesLoading_start == false ) {
recommendedImagesLoading_start = true;
RecommendedImagesPagInation.$loading.show();
if ( RecommendedImagesPagInation.$loadMore ) RecommendedImagesPagInation.$loadMore.hide();
var orientation = $('#homepage_layout_kind').val() == '2' || $('#homepage_layout_kind').val() == '3' ? '' : 'horizontal';
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/recommendedMedia.php",
data: 'w='+$('#id').val()+'&q='+encodeURIComponent(that.q)+'&p='+pageNUM+'&m=1&imgT='+that.type+'&orientation='+orientation,
success: function( data ) {
RecommendedImagesPagInation.$loading.hide();
if ( RecommendedImagesPagInation.$loadMore ) RecommendedImagesPagInation.$loadMore.show();
var json = $.parseJSON(data);
if ( json.results.length == 0 ) {
if ( pageNUM==1 ) {
var recImage = '<div class="RecommendedImagesNoResult" style="width: 100%;padding: 20px;text-align: center;font-size: 1.2em;">'+translations.homepageRI.noResultsFound+'</div>';
if ($('#RecommendedImages').find('.RecommendedImagesNoResult').length==0) {
$('#RecommendedImages').append(recImage);
}
}
return; //It will make sure we will not send it again: recommendedImagesLoading_start
} else {
if ( pageNUM == 1 ) {
$('#RecommendedImages').append('<div class="recommendedImagesItem-sizer"></div>');
$('#RecommendedImages').masonry({
itemSelector: '.recommendedImagesItem',
percentPosition: true,
columnWidth: '.recommendedImagesItem-sizer',
transitionDuration: 0
});
}
if ( json.output == 'library' ) {
$(json.results).each(function (index, styleSettings) {
if (styleSettings['id']=='') {
return true;
}
if (styleSettings['mediaKind']=='video') {
styleSettings['previewURL'] = styleSettings['previewImage'];
}
var recImage = '<div class="recommendedImagesItem" data-type="'+that.type+'">';
recImage += '<img src="'+styleSettings['previewURL']+'">';
if ( styleSettings['mediaKind'] == 'video' ) {
recImage += '<div class="mediaKind_play"><i class="fa fa-play fa-2x"></i></div>';
}
if ( styleSettings['provider'] == 'pixabay' ) {
recImage += '<div class="credits"><a target="_blank" href="https://www.pixabay.com">Pixabay</a></div>';
}
if ( styleSettings['provider'] == 'unsplash' ) {
recImage += '<div class="credits">';
recImage += '<a target="_blank" href="'+styleSettings['photographerURL']+'">'+styleSettings['photographerName']+'</a>';
recImage += '</div>';
}
recImage += '<div class="styles"></div>';
recImage += '<i class="ace-icon fa fa-check-circle"></i>';
recImage += '<div class="saved-label-container">';
recImage += '<div class="saved-label">'+translations.homepageRI.savedLabel+'</div>';
recImage += '<div class="saved-label-cover"></div>';
recImage += '</div>';
recImage += '</div>';
var $recImage = $(recImage);
$('#RecommendedImages').append($recImage);
$('#RecommendedImagesContainer').attr('data-type',that.type);
if ( that.type != 'patterns' ) {
$('#RecommendedImagesContainer').attr('data-type','');
$('#RecommendedImages').masonry('appended',$recImage);
$recImage.imagesLoaded().progress( function( o, r ) {
$('#RecommendedImages').masonry('layout');
$(r.img).css({ visibility: 'visible' });
});
}
$recImage.find('img').click(function() {
var $thisParentRecommendedImagesItem    = $(this).parent('.recommendedImagesItem');
var $thisParent                         = $thisParentRecommendedImagesItem.find('.styles');
var imageURL                            = styleSettings['webformatURL'];
var previewURL                          = styleSettings['previewURL'];
$thisParentRecommendedImagesItem.siblings().removeClass('active');
$thisParentRecommendedImagesItem.addClass('active');
homepage_PickNewObjectToHomepageBackground(true,$thisParentRecommendedImagesItem,previewURL,imageURL,$thisParent,that.type);
if ( that.type != 'patterns' ) WizardAddImagesToHistory.add(previewURL,imageURL);
that.showHideBackgroundOptions();
});
});
}
}
recommendedImagesLoading_start = false;
/**
* If there is no scroll bar we need to load more library images until we will
* get a scroll bar, to do so we start a recorsive function until the scrollbar
* appear or until there is no more library images.
* Note: We use `setTimeout` because we display all the images only when they loaded,
* so we need to wait a little for some images to be loaded so the scrollbar will appear.
*/
setTimeout( function() {
if ( !(that.popUp.find('#RecommendedImagesContainer').get(0).scrollHeight > that.popUp.find('#RecommendedImagesContainer').height()) ) {
RecommendedImagesPage++;
that.getRecommendedImages(RecommendedImagesPage);
}
},200);
}
});
}
};
/**
* The method is showing to the user only the relevant homepage background settings according to his
* video / image & color ( image or pattern ) / slide show background type
*
* Note: The method is first hiding all of the background options and after that according to the user settings
* it is showing only the relevant settings
*/
that.showHideBackgroundOptions = function() {
var homepage_style = that.$container.find('#homepage_style').val();
that.popUp.find('#libraryHomepageColorsCat').addClass('hidden');
that.popUp.find('#libraryHomepageColorsCat_popup').addClass('hidden');
that.popUp.find('#libraryHomepagePatternsCat').addClass('hidden');
that.popUp.find('#libraryHomepagePatternsCat_popup').addClass('hidden');
that.popUp.find('#riCategories').children('[data-type="color"],[data-type="pattern"]').addClass('hidden');
that.$container.find('#RecommendedImagesHomepage').addClass('hidden');
that.$container.find('#homepageFilterDesign').addClass('hidden');
that.$container.find('#parallax_homepage_container').addClass('hidden');
that.$container.find('#home_opacity_container').addClass('hidden');
that.$container.find('#wizardImageTabColorsRecommended').addClass('hidden');
that.$container.find('a[data-relation-id="hmBgFilters"]').data('full-size',false);
WizardAddImagesToHistory.hide();
WizardAddImagesToHistory.disabled = true;
that.isHmImgTypeSupported = false;
switch ( homepage_style ) {
case '3':
if ( Wizard.homePageChangingImages.getItemsAmont() == 1 ) {
that.isHmImgTypeSupported = true;
WizardAddImagesToHistory.disabled = false;
WizardAddImagesToHistory.show();
that.$container.find('#RecommendedImagesHomepage').removeClass('hidden');
that.popUp.find('#libraryHomepageColorsCat').removeClass('hidden');
that.popUp.find('#libraryHomepageColorsCat_popup').removeClass('hidden');
that.popUp.find('#libraryHomepagePatternsCat').removeClass('hidden');
that.popUp.find('#libraryHomepagePatternsCat_popup').removeClass('hidden');
that.popUp.find('#riCategories').children('[value="colors"],[value="patterns"]').removeClass('hidden');
that.$container.find('#wizardImageTabColorsRecommended').removeClass('hidden');
that.$container.find('#parallax_homepage_container').removeClass('hidden');
}
that.$container.find('#homepageFilterDesign').removeClass('hidden');
that.$container.find('#home_opacity_container').removeClass('hidden');
that.$container.find('a[data-relation-id="hmBgFilters"]').data('full-size',true);
break;
default:
that.$container.find('#homepageFilterDesign').removeClass('hidden');
that.$container.find('#parallax_homepage_container').removeClass('hidden');
that.$container.find('#home_opacity_container').removeClass('hidden');
that.$container.find('a[data-relation-id="hmBgFilters"]').data('full-size',true);
break;
}
};
/**
* The method is updating the homepage background type according to the image that the user
* has selected for example images / patterns
*
* Note:This feature is meant for patterns so we would know how to behave in the front if the user
* has selected a pattern.
*
* @param {string}  type - The new type of background image
*/
that.updateHomepageImageType = function( type ) {
var uploadFile = topWindow.uploadFiles[imageHomepageLiveEleID];
uploadFile.settings.set('type',type);
uploadFile.input.trigger('change.w_h_p_c_i');
};
/**
* The method is showing the saved label and save and continue button
*/
that.showSavedLabel = function() {
if ( that.type == 'imagesItems' || that.type == 'patterns' ) {
that.popUp.find('.saved-label-container').hide();
that.popUp.find('.recommendedImagesItem.active .saved-label-container').fadeIn(500,function() {
$(this).fadeOut(500);
});
that.popUp.find('#RecommendedImagesContainer').css('height',that.popUp.find('#RecommendedImagesContainer').parent().height()-that.popUp.find('#saveAndClose').height());
}
that.popUp.find('#saveAndClose').show();
};
/**
* The function is showing the popup tools that the user can use
*
* Note: This function is called from the method `that.show()` with selectors
* of the tools we want to show the user according to the popup type
*
* @param {array} selectors -  Selectors for the tools we want to show the user
*/
function showPopUpTools( selectors ) {
for (var i = 0; i < selectors.length; i++) {
that.popUp.find(selectors[i]).show();
}
}
/**
* The function is hiding all of the popup tools that the user can use.
*/
function hidePopUpTools() {
that.popUp.find('.colorsContainer').hide();
that.popUp.find('#RecommendedImagesContainer').hide();
that.popUp.find('#rcContainer').hide();
that.popUp.find('.search-container').hide();
that.popUp.find('#ActiveHomepageColor').hide();
that.popUp.find('#saveAndClose').hide();
that.popUp.find('#RecommendedImagesContainer').css('height','');
}
/**
* The function is generating the poup HTML.
*
* @return {string} html - The HTML structure of the modal.
*/
function generatePopUpHTML() {
var html = '';
html += '<div class="modal r-i-modal s123-modal fade" role="dialog" data-action="false" data-backdrop="false">';
html += '<div class="modal-dialog" role="document">';
html += '<div class="modal-content">';
html += '<div class="modal-header">';
html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
html += '<h4 class="modal-title"></h4>';
html += '</div>';
html += '<div class="modal-body">';
html += '<div class="input-group search-container" style="display: flex; height: 44px; width: 100%;">';
html += '<input type="text" maxlength="20" class="search form-control search-query data-hj-whitelist" placeholder="'+escapeHtml(translations.homepageRI.placeholder)+'" data-rule-flickr-pattern="true" data-msg-flickr-pattern="'+escapeHtml(translations.homepageRI.patterns)+'" style="height: 100%; width: 100%;">';
html += '<span id="searchStylesIconDemo" class="fa fa-search form-control-feedback"></span>';
html += '<select id="riCategories" class="form-control" style="height: 100%; width: 50%;">';
html += '<option value="all">' + escapeHtml(translations.homepageRI.all) + '</option>';
for (var i = 0; i < libraryHomepageArr.length; i++) {
if ( libraryHomepageArr[i].items && libraryHomepageArr[i].items.length > 0 ) {
for (var j = 0; j < libraryHomepageArr[i].items.length; j++) {
var module = libraryHomepageArr[i].items[j];
html += '<option data-type="' + module.type + '" value="' + escapeHtml(module.keyword).toLowerCase() + '">' + escapeHtml(module.name) + '</option>';
}
}
}
html += '</select>';
html += '</div>';
html += '<div id="RecommendedImagesContainer" class="fancy-scrollbar">';
html += '<div id="RecommendedImages"></div>';
html += '</div>';
html += '<div class="colorsContainer">';
html += '<div id="ActiveHomepageColor">';
html += '<div class="customColorHeader">';
html += '<div class="button">';
html += '<button type="button" class="btn btn-block btn-primary button1">Custom Color</button>';
html += '<button type="button" class="btn btn-sm btn-primary button2" style="display:none;"><i class="fa fa-times"></i></button>';
html += '</div>';
html += '</div>';
html += '<div class="customColorBOX" style="display: none;">';
html += '</div>';
html += '</div>';
html += '<div id="homepageGradientsColorsList" class="fancy-scrollbar"></div>';
html += '</div>';
html += '<div id="rcContainer">';
html += '<div class="boxContent" class="fancy-scrollbar" style="max-height:' + ( $(window).height() - 178 ) + 'px"></div>';
html += '</div>';
html += '<div id="saveAndClose">';
html += '<a class="btn btn-success">'+translations.homepageRI.saveAndClose+'</a>';
html += '</div>';
html += '</div>';
html += '</div>';
html += '</div>';
html += '</div>';
/* add custom backdrop for the popup because the bootstrap backdrop is not good enough because it is appended to the
body and not the container we also could not user it because it is added only after the `bs.shown` is fired */
html += '<div class="r-i-back-drop"></div>';
return html;
}
/**
* The function is resizing the selected element to fit the popup.
*
* @param {jq object} $el - Element we want to fit the container
*/
function resizeElment( $el ) {
var newHeight = that.popUp.find('.modal-body').height();
$el.siblings().each(function( index, element ) {
newHeight -= $(element).outerHeight();
});
newHeight = newHeight - that.popUp.find('.search-container').outerHeight() + 30;
$el.css({
maxHeight: newHeight
});
}
/**
* Library Drop Down Button Click - When user is selecting a library we need to update the
* `imageHomepageLiveEleID` according to the upload input id because we use this for downloading
* images that are not hosted with us
*/
that.addLibraryAbility = function() {
that.$container.find('.image-homepage-live')
.off('click').on('click', function() {
var $this = $(this);
var tags = $this.data('search');
showResults(tags,false);
if ( $this.hasClass('image-homepage-live') ) imageHomepageLiveEleID = $this.data('id');
});
}
/**
* The function is adding all the events to the inputs
*/
function addPluginAbilities() {
var $popupSearch = that.popUp.find('.search');
var $riCategories = that.popUp.find('#riCategories');
that.$container.find('#hmBgSapes').one('settingBoxOpen', function() {
var $shapesContainer = that.$container.find('.shapes-design-styles');
var activeShapeID = $('#homepageShapeDivider').val();
var $homepageShapeDivider = that.$container.find('#homepageShapeDivider');
var $homepageShapeDividerList_Size = that.$container.find('#homepageShapeDividerList_Size');
$shapesContainer.empty();
Wizard.infiniteScroll.init({
isMobile: $('html').data('device') !='computer',
$container: that.$container.find('#homepageShapeDividerList'),
ajax: {
type: 'POST',
url: '/versions/2/wizard/modules/wizardInfiniteScroll.php',
data: {
w: $('#id').val(),
type: 'shapeDividers',
limit: 12,
},
buildItemCallback: function( shape ) {
var html = '';
html += '<div style="order:' + shape.order + ';" data-id="' + shape.id + '" data-default-size="' + shape.defaultSize + '" class="homepage-shapes-button-container">';
html += '<div class="shapes-design-button ' + ( activeShapeID == shape.id ? 'active' : '') + '">';
html += '<i class="ace-icon fa fa-check-circle"></i>';
html += '</div>';
html += '<img class="shapes-design-button-image" src="https://cdn-cms-localhost.f-static.com/ready_uploads/shapeLayout/v28/400_'+shape.id+'_shapeLayout.jpg?v=' + $GLOBALS['v-cache'] +'" style="z-index:1;opacity: 1;">';
html += '</div>';
var $shape = $(html);
$shape.click( function( event ) {
var $this = $(this);
var id = $this.data('id');
var defaultSize = $this.data('default-size');
$homepageShapeDivider.val(id).trigger('change');
$homepageShapeDividerList_Size.val(defaultSize).trigger('change');
});
$shapesContainer.append($shape);
}
}
});
});
that.backDrop.on('click', function() {
that.popUp.modal('hide');
});
that.popUp.find('#saveAndClose').on('click', function() {
that.popUp.modal('hide');
});
$popupSearch
.on('keydown', function( event ) {
var $this = $(this);
var eventKey = event.which;
clearTimeout(this.searchLibraryInputFinished);
if ( eventKey == 13 ) {
showResults($this.val(),true);
} else {
this.searchLibraryInputFinished = setTimeout( function() {
showResults($this.val(),true);
},1000);
}
});
$riCategories.on('change',function() {
var $this = $(this);
showResults($this.val(),false);
});
that.addLibraryAbility();
/**
* Recommended Categories Click - When user is selecting a `recommended categories` we need to update the
* `imageHomepageLiveEleID` to image & color uplado file input because at the moment only this backgroud type
* is supporting the `recommended categories`
*/
that.$container.find('.cat')
.on('click', function() {
var $this = $(this);
var tags = $this.data('search');
showResults(tags,false);
imageHomepageLiveEleID = Wizard.homePageChangingImages.fistInputID;
});
/**
* Popup Recommended Categories Click - When user is selecting a `recommended categories` in the popup
* we just need to open the images category
*/
that.popUp.find('.cat')
.on('click', function() {
var $this = $(this);
var tags = $this.data('search');
showResults(tags,false);
});
that.$container.find('#homepage_style')
.on('change.set_homepage_style',function() {
that.showHideBackgroundOptions();
$('.homepage_style_option').hide();
$('#homepage_style_option_'+$(this).val()).show();
that.$container.find('#imagesLibraryForm').hide();
if ( $(this).val() == '2' ) {
that.$container.find('#imagesLibraryForm').show();
}
if ( $(this).val() == '5' ) {
if ( $('#home_youtube_background').val().length === 0 ) {
$('#home_youtube_background').val('https://www.youtube.com/watch?v=9E4J7EoUPS0');
}
}
filterHomepageOptionsList();
SettingsBox.hide();
/* prevent from updating the homepage background image when the `background type` is not supporting this feature
for example videos or changing images are not supporting that, this feature is meant for patterns so we would
know how to behave in the front if the user has selected a pattern */
if ( $(this).val() != '3' ) {
that.isHmImgTypeSupported = false;
} else {
that.isHmImgTypeSupported = true;
}
})
.trigger('change.set_homepage_style');
that.popUp.find('.customColorHeader')
.on('click', function() {
if ( that.popUp.find('#ActiveHomepageColor').hasClass('active') ) {
that.popUp.find('.customColorHeader .button1').show();
that.popUp.find('.customColorHeader .button2').hide();
that.popUp.find('.customColorBOX').hide();
that.popUp.find('#ActiveHomepageColor').removeClass('active');
that.popUp.find('#homepageGradientsColorsList').css('max-height','');
} else {
that.popUp.find('.customColorHeader .button1').hide();
that.popUp.find('.customColorHeader .button2').show();
that.popUp.find('.customColorBOX').fadeIn();
that.popUp.find('#ActiveHomepageColor').addClass('active');
resizeElment(that.popUp.find('#homepageGradientsColorsList'));
}
});
/**
* Reset the homepage background type because the patterns are not supporting some features such as filter effects
* and because they are not saved in the last used images we need to reset it so the user will see the features
*/
that.$container.find('.lastImages').on('click.reset_homepagem_img_type','.recommendedImagesItem', function() {
imageHomepageLiveEleID = Wizard.homePageChangingImages.fistInputID;
that.updateHomepageImageType('images');
});
}
/**
* The function is showing the results by the value that the user is searching
*
* @prarm {string} value - The value that the user has entered
*/
function showResults( value, searchInput ) {
var $popupSearch = that.popUp.find('.search');
var $riCategories = that.popUp.find('#riCategories');
that.q = '';
if ( value.length == 0 ) value = 'all';
if ( !searchInput && value.toLowerCase() == 'colors' ) {
that.showPoUp('colors');
$popupSearch.val(value);
} else if ( !searchInput && value.toLowerCase() == 'gradients' ) {
that.showPoUp('gradients');
$popupSearch.val(value);
}  else if ( value.toLowerCase() == 'all' ) {
that.showPoUp('all');
} else {
that.q = value.toLowerCase();
/* if the value that the user is searching found in the select box we also
need change the select box value */
if ( $riCategories.children('[value="' + escapeHtml(that.q) + '"]').length > 0 ) $riCategories.val(that.q);
if ( !searchInput && value.toLowerCase() == 'patterns' ) {
that.showPoUp('patterns');
} else {
that.showPoUp('imagesItems');
}
$popupSearch.val(value);
}
}
/**
* The function is showing the recommended images according to the searched tag
*/
function searchImagesByQuery() {
RecommendedImagesPagInation.destroy();
RecommendedImagesPagInation.init({
isMobile: $('html').data('device') !='computer',
$recommendedImagesContainer: that.popUp.find('#RecommendedImagesContainer'),
$recommendedImages: that.popUp.find('#RecommendedImages'),
recommendedImagesPage: RecommendedImagesPage
});
RecommendedImagesPage = 1;
that.getRecommendedImages(RecommendedImagesPage);
}
/**
* The function is adding the the colors / gradients  to the popup
*/
function addColorsListToPoUp( $container, isGradients ) {
$container.show();
Wizard.infiniteScroll.init({
isMobile: $('html').data('device') !='computer',
$container: $container,
ajax: {
type: 'POST',
url: '/versions/2/wizard/modules/wizardInfiniteScroll.php',
data: {
w: $('#id').val(),
type: (isGradients ? 'gradients' :'colors' ),
limit: 100,
},
buildItemCallback: function( color ) {
var gradient    = color[0];
var $html = $('<div class="gradientsList" '+(isGradients ? 'data-type="gradients"' : '' )+' style="background:'+(gradient)+';" data-gradient="'+(gradient)+'" data-type="'+that.type+'"><i class="ace-icon fa fa-check-circle"></i></div>');
$html.click(function() {
var $this       = $(this);
var gradient    = $this.data('gradient');
var textColor = getOppositeColor(gradient,isGradients);
holdWizardSave = true;
$this.siblings().removeClass('active');
$this.addClass('active');
that.updateHomepageImageType(that.type);
wizard_ClearAllColorsRecommended();
$('#home_text_color').val(textColor).trigger('change');
if ( gradient.indexOf('gradient') !== -1 ) {
$('#homepageGradientsColors').val(gradient).trigger('change');
} else {
$('#home_background_color').val(gradient).trigger('change');
}
$('#'+imageHomepageLiveEleID).val('').trigger('change');
filterHomepageOptionsList();
holdWizardSave = false;
$('#homepage_style').val('3').trigger('change');
that.showSavedLabel();
});
$container.append($html);
}
}
});
}
/**
* The function is returning the opposite color from the color
* it received, we use this for the gradients text color and the color boxes
*
* @param  {string}  color - The color value (hex) that we want to return the opposite
* @pararm {boolean} isGradients - For gradients we need to extract the color from a string
* @return {string}  unnamed -The opposite color
*/
function getOppositeColor( color, isGradients ) {
var tmpColor = color;
if ( isGradients ) {
/* remove all whitespace https://stackoverflow.com/a/6623263
so the color structure will be correct*/
tmpColor = tmpColor.replace(/ /g,'').split(',')[1];
/* get only the hex value because some gradients has color
value like `#ff9a9e 0%` */
tmpColor = tmpColor.substr(0,7);
}
return invertColor(tmpColor,true);
}
/**
* Show the main page of the library tab
*/
function libraryCategoriesOutput( $container, items ) {
var html = '';
for ( var i = 0; i < items.length; i++ ) {
var module = items[i];
if ( module.type == 'color' ) {
html += '<div id="libraryHomepageColorsCat" class="cat" data-search="'+escapeHtml(module.keyword)+'">';
html += '<div class="images">';
html += '<div class="libraryHomepageColorsCat"></div>';
html += '<div class="catName">'+escapeHtml(module.name)+'</div>';
html += '</div>';
html += '</div>';
} else if ( module.type == 'gradients' ) {
html += '<div id="libraryHomepageGradientsCat" class="cat" data-search="'+escapeHtml(module.keyword)+'">';
html += '<div class="images">';
html += '<div class="libraryHomepageColorsCat"></div>';
html += '<div class="catName">'+escapeHtml(module.name)+'</div>';
html += '</div>';
html += '</div>';
} else if ( module.type == 'pattern' ) {
html += '<div id="libraryHomepagePatternsCat" class="cat" data-search="'+escapeHtml(module.keyword)+'">';
html += '<div class="images">';
html += '<img src="'+module.image1+'">';
html += '<div class="catName">'+escapeHtml(module.name)+'</div>';
html += '</div>';
html += '</div>';
} else {
html += '<div class="cat" data-search="'+escapeHtml(module.keyword)+'">';
html += '<div class="images">';
html += '<img src="'+module.image1+'">';
html += '<div class="catName">'+escapeHtml(module.name)+'</div>';
html += '</div>';
html += '</div>';
}
}
$container.find('.boxContent').append(html);
}
return that;
}();
/**
* Pagination Plugin Class
*/
Wizard.infiniteScroll = new function() {
var that = this;
/**
* PagInation Initialize
*/
that.init = function( settings ) {
if ( !settings ) return;
that.isMobile = settings.isMobile;
that.$container = settings.$container;
that.ajax = settings.ajax;
that.inProgress = false;
that.pageNum = 1;
that.$paginationContainer = $(generateHtml());
that.$loading = that.$paginationContainer.find('.loading-icon');
that.$mobileBtn = that.$paginationContainer.find('#loadMore');
that.$container.append(that.$paginationContainer);
that.addLoadNextPageAbility();
that.getPage();
};
/**
* The method is loading the next page images
*/
that.addLoadNextPageAbility = function() {
if ( that.isMobile ) {
that.$mobileBtn.on('click.wizard_infinite_scroll', function() {
that.getPage();
that.inProgress = true;
});
} else {
that.$container.on('scroll.wizard_infinite_scroll', function() {
var $this = $(this);
var st = $this.scrollTop();
if ( st > ( (that.$container[0].scrollHeight - that.$container[0].offsetHeight) * 0.80 ) ) {
that.getPage();
that.inProgress = true;
}
});
}
};
/**
* The method is stopping the plugin abilities
*/
that.destroy = function() {
that.$loading.hide();
that.$container.off('scroll.wizard_infinite_scroll');
that.$mobileBtn.hide();
that.$paginationContainer.remove();
};
/**
* The method is fetching the next page and returning the result to the function
* we call on initialize
*/
that.getPage = function() {
if ( that.inProgress ) return;
showLoadingAnimation();
that.ajax.data.page = that.pageNum;
$.ajax({
type: that.ajax.type,
url: that.ajax.url,
data: that.ajax.data,
success: function( data ) {
data = tryParseJSON(data);
that.pageNum++;
that.inProgress = false;
hideLoadingAnimation();
if ( !data.hasNextPage ) {
that.destroy();
} else {
/**
* If there is no scroll bar we need to load more pages until we will
* get a scroll bar, to do so we start a recursive function until the scrollbar
* appear or until there is no more pages.
* Note: We use `setTimeout` because we display all the items only when they loaded,
* so we need to wait a little for some items to be loaded so the scrollbar will appear.
*/
setTimeout( function() {
if ( !(that.$container.get(0).scrollHeight > that.$container.height()) ) {
that.getPage();
}
},200);
}
for (var i = 0; i < data.items.length; i++) {
if ( that.ajax.buildItemCallback ) that.ajax.buildItemCallback.call(this,data.items[i]);
}
that.$container.append(that.$paginationContainer);
}
});
};
/**
* The function is generating html of the plugin elements
*/
function generateHtml() {
var html = '';
html += '<div class="wizard-pagination text-center" style="width: 100%; padding: 10px;">';
html += '<div class="loading-icon" style="display:none; width: 100%;">';
html += '<i class="ace-icon fa fa-spinner fa-spin fa-2x"></i>';
html += '</div>';
if ( that.isMobile ) {
html += '<div style="width: 100%;">';
html += '<a id="loadMore" class="btn btn-primary">'+translations.loadmore+'</a>';
html += '</div>';
}
html += '</div>';
return html;
}
/**
* The function is creating loading animation for the user
*/
function showLoadingAnimation() {
that.$loading.show();
that.$mobileBtn.hide();
}
/**
* The function is showing the pagination elements after the page is loaded
*/
function hideLoadingAnimation() {
that.$loading.hide();
that.$mobileBtn.show();
}
return that;
}();
/**
* Homepage Changing Images Class
*/
Wizard.homePageChangingImages = new function() {
var that = this;
/**
* Initialize Homepage Changing Images Class
*/
that.init = function() {
that.$container = $('#homepage_style_option_3 #changinImagesContiner');
that.$controller = $('#changingImagesAdd');
that.$originalInputs = $('.ch-images-val');
that.maxAmount = that.$originalInputs.length;
addUploadFiles();
/**
* Undo / Redo Support - When user is using the undo / redo we need to rebuild completely the
* upload files so they will be synced with the original inputs
*/
that.$originalInputs.on('change.w_h_p_c_i', function() {
that.$fileUploadBoxes.remove();
addUploadFiles();
Wizard.homePageBgOptions.addLibraryAbility();
});
/**
* Add sortable ability for the images container
*
* Documentation: https://api.jqueryui.com/sortable/
*/
that.$container.sortable({
handle: '.sortable-icon', // drag handler
appendTo: that.$container, // sortable container
containment: 'parent', // limit the dragging inside of the parent
update: function() {
save();
that.$fileUploadBoxes = that.$container.find('.fileUploadBox');
that.fistInputID = that.$fileUploadBoxes.first().find('.file-upload-input-field').get(0).id;
resetControllersVisiblilty();
$('#changing_images_helper').trigger('change');
}
});
};
/**
* Get all visible and filled inputs amount
*/
that.getItemsAmont = function() {
return that.$fileUploadBoxes.length;
};
/**
* The method is returning the hidden input index by the id it received from all of the
* hidden inputs
*
* Note: At the moment the method is used from `imagesLibrary/pixabay_video.php` and it is called
* when the user is changing background video from the video library
*
* @param {string} uploadFileInputId - Background image id that the user is changing
* @return {integer} imageNumber - The input index we found in the inputs array
*/
that.getInputIndex = function( uploadFileInputId ) {
var inputIndex = 1;
$.each(that.$fileUploadBoxes.find('.file-upload-input-field'), function( index, input ) {
if ( input.id === uploadFileInputId ) {
inputIndex = index+1;
return false;
}
});
return inputIndex;
};
/**
* The function is generating the upload files that are synced with the original inputs
*/
function addUploadFiles() {
var html = '';
$.each(that.$originalInputs, function( index, input ) {
var $this = $(this);
/**
* Exit when it is not the first and it is empty
* Note: The user can choose color as background and as a result
* the first input will be empty but we still need to build it
*/
if ( index > 0 && $this.val().length === 0 ) return;
html += generateFileUploadHtml(websiteID,(index == 0),{
id: $this.get(0).id,
value: $this.val(),
settings: that.$container.find($this.data('settings-selector')).val()
});
});
that.$container.append(html);
refresh();
}
/**
* The function is refreshing all of the object events
*/
function refresh() {
UploadSingleFilesInitialize();
that.$fileUploadBoxes = that.$container.find('.fileUploadBox');
that.fistInputID = that.$fileUploadBoxes.first().find('.file-upload-input-field').get(0).id;
that.$controller.off('click.add_new').on('click.add_new', function() {
if ( $(this).hasClass('disabled') ) return false;
that.$container.append(generateFileUploadHtml(websiteID,false,{value:'',settings:JSON.stringify({})}));
refresh();
var $newfileUploadBox = that.$fileUploadBoxes.last();
var id = $newfileUploadBox.find('.file-upload-input-field').get(0).id;
var uploadFile = topWindow.uploadFiles[id];
addRemoveAbility($newfileUploadBox,uploadFile);
Wizard.homePageBgOptions.showHideBackgroundOptions();
Wizard.homePageBgOptions.addLibraryAbility();
});
var addSortableIcon = that.$fileUploadBoxes.length > 1;
/**
* Loop over the file upload boxes and add `+` buttons to show the next upload file
* and hide the empty file upload boxes
*/
$.each(that.$fileUploadBoxes, function( index, fileUploadBox ) {
var $this = $(this);
var $hiddenInput = $this.find('.file-upload-input-field');
var id = $hiddenInput.get(0).id;
var uploadFile = topWindow.uploadFiles[id];
$this.find('.sortable-icon').remove();
if ( addSortableIcon ) $this.append('<div class="sortable-icon"><i class="fa fa-arrows" aria-hidden="true"></i></div>');
/**
* New Custom Change Event - We add it to the hidden input because we need to support the undo plugin, it is
* working with the hidden inputs
*/
uploadFile.input.off('change.w_h_p_c_i').on('change.w_h_p_c_i', function( event, flag ) {
var image = $('#'+id+'').val();
var tiny_image = image.replace("normal_", "100_");
if ( image.indexOf('unsplash.com') !== -1 ) {
tiny_image = image.replace("&w=2500", "&w=100");
}
UpdateImagePreview(id, { normal: image, tiny: tiny_image, patterns: uploadFile.settings.get().type == 'patterns' });
UploadLibraryImageToUserWebsite(id);
save();
that.$fileUploadBoxes = that.$container.find('.fileUploadBox');
Wizard.homePageBgOptions.showHideBackgroundOptions();
resetControllersVisiblilty();
/**
* Bug Fix - On input change we need to abort downloading of the images from external server because it is
* it is preventing from saving the new record in the undo and it caused bugs such as no redo for patterns and more
*/
if ( UploadLibraryImageToUserWebsite_currentRequest !== null ) {
UploadLibraryImageToUserWebsite_currentRequest.abort();
}
var thisIndex = that.$fileUploadBoxes.find('.file-upload-input-field').index(uploadFile.input);
$(that.$originalInputs[thisIndex]).trigger('change.user_action',[flag]);
});
uploadFile.settings.obj.off('input.w_h_p_c_i').on('input.w_h_p_c_i', function() {
save();
});
addRemoveAbility($this,uploadFile);
});
$('.tooltip.in').remove();
changeControllerStatus();
InitializeToolTips();
ColorboxInitial('#homepage_style_option_3 #changinImagesContiner [data-rel="colorbox"]');
resetControllersVisiblilty();
}
/**
* The function is changing the controller
*/
function changeControllerStatus() {
var tooTipText = '';
if ( that.getItemsAmont() < that.maxAmount ) {
that.$controller.removeClass('disabled');
tooTipText = translations.homepageChangingImages.enabled;
} else {
that.$controller.addClass('disabled');
tooTipText = translations.homepageChangingImages.disabled.replace('{{maxAmount}}',that.maxAmount);
}
/**
* In order to change the tootip text after the initialization we need to use `data-original-title`
* Solution: http://queirozf.com/entries/change-a-tooltip-s-text-after-initialization-in-bootstrap
*/
that.$controller.attr('data-original-title',tooTipText);
that.$controller.tooltip({
delay: {
show: 500,
hide: 0
},
container: 'body',
placement: 'auto'
});
}
/**
* The function is adding a custom delete event to the upload file remove button
* because in this plugin we want to delete completely the upload file because we are building them
* dynamically
*
* @prarm {jquery object} $fileUploadBox - File upload box that we need to remove
* @prarm {object} uploadFile - upload file object
*/
function addRemoveAbility( $fileUploadBox, uploadFile ) {
uploadFile.btns.remove.on('click.changing_images', function( event ) {
uploadFile.settings.obj.remove();
$fileUploadBox.remove();
save();
refresh();
Wizard.homePageBgOptions.showHideBackgroundOptions();
delete topWindow.uploadFiles[id];
});
}
/**
* The function is updating the original inputs by the order or the upload files
*/
function save() {
that.$originalInputs.val('');
that.$fileUploadBoxes = that.$fileUploadBoxes.filter(function( index, uploadBox ) {
return $(this).find('.file-upload-input-field').val().length > 0;
});
$.each(that.$fileUploadBoxes.find('.file-upload-input-field'), function( index, input ) {
var id = $(this).get(0).id;
var uploadFile = topWindow.uploadFiles[id];
var $original = $(that.$originalInputs[index]);
if ( $original.length === 0 ) return;
$original.val(uploadFile.input.val());
$('#'+$original.get(0).id+'_settings').val(uploadFile.settings.obj.val());
});
filterHomepageOptionsList();
}
/**
* The function Generate a unique ID.
* Documentation : http://phpjs.org/functions/uniqid/
*/
function uniqid(prefix, more_entropy) {
if (typeof prefix === 'undefined') prefix = '';
var retId;
var formatSeed = function (seed, reqWidth) {
seed = parseInt(seed, 10).toString(16);
if (reqWidth < seed.length) {
return seed.slice(seed.length - reqWidth);
}
if (reqWidth > seed.length) {
return Array(1 + (reqWidth - seed.length)).join('0') + seed;
}
return seed;
};
if (!this.php_js) {
this.php_js = {};
}
if (!this.php_js.uniqidSeed) {
this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
}
this.php_js.uniqidSeed++;
retId = prefix;
retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
retId += formatSeed(this.php_js.uniqidSeed, 5);
if (more_entropy) {
retId += (Math.random() * 10).toFixed(8).toString();
}
return retId;
}
/**
* The function is generating the upload file html
*
* @param {integer} websiteID - Website id
* @param {boolean} disableDelete - true if upload file don't have delete button (used for the first upload file)
*/
function generateFileUploadHtml( websiteID, disableDelete, obj ) {
var html = '';
var id = uniqid('u-f-tmp');
html += '<div class="input-file-upload" id="home_slider_image_'+id+'" data-website-id="'+websiteID+'" data-mb="30" data-file-kind="5" data-value="'+escapeHtml(obj.value)+'" data-library="imageHomepageLive & videoLive" data-min-height="300" data-min-width="300" data-min-library-width="1200" data-scroll-preview="#page-top" data-crop="disable" data-filter="disable" data-image-focus-point="true"></div>';
html += '<textarea id="home_slider_image_'+id+'_settings" name="home_slider_image_'+id+'_settings" class="hidden">'+escapeHtml(obj.settings)+'</textarea>';
return html;
}
/**
* The function is reseting the `+` and `x` buttons visibility
*
* In order to show the `+` button near the upload file input the next statement need to be true:
* if the next upload file is visible and it is not empty
*/
function resetControllersVisiblilty() {
var $chaningSpeedView = $('#home_slider_chaning_speed').closest('.s123-slider');
$.each(that.$fileUploadBoxes, function( index, fileUploadBox ) {
var $this = $(this);
var $hiddenInput = $this.find('.file-upload-input-field');
if ( index === 0 ) {
$this.find('#'+$hiddenInput.get(0).id+'_removeBtn').hide();
} else {
$this.find('#'+$hiddenInput.get(0).id+'_removeBtn').show();
}
});
if ( that.getItemsAmont() == 1 ) {
$chaningSpeedView.hide();
} else if ( that.getItemsAmont() < that.maxAmount ) {
$chaningSpeedView.show();
}
}
return that;
}();
/**
* Progressive Web Application Class
*/
Wizard.progressiveWebApp = new function() {
var that = this;
/**
* Initialize Progressive Web Application Class
*/
that.init = function( settings ) {
if ( !settings ) return;
that.$container = settings.$container;
that.$videoExamples = that.$container.find('.pwa-example');
that.$videoExamples.on('click', function() {
ShowTourWelcomeVideoExplain($(this).data('title'),$(this).data('video'),'','pwa');
});
that.$container.find('#mobileAppBgColorType').on('change.show_upload_file', function() {
switch ( $(this).val() ) {
case '0':
that.$container.find('#mobileAppSplashScreenLogo').closest('.pwa-logo-parent').fadeOut();
break;
case '1':
that.$container.find('#mobileAppSplashScreenLogo').closest('.pwa-logo-parent').fadeIn();
break;
}
})
.trigger('change.show_upload_file');
};
return that;
}();
/**
* Textarea Auto Increase Height.
*/
var textareaAutoIncreaseHeight = function() {
var that = {
minContentHeight: 100,  // default minimum height based on the content
maxContentHeight: 200   // default maximum height based on the content
};
/**
* Initialize
*/
that.init = function() {
that.elements = $('.textarea-auto-increase-height');
if ( that.elements.length === 0 ) return;
that.events.off();
that.elements.each(function() {
var $this = $(this);
$this.css({ maxHeight: that.maxContentHeight });
/**
* AutoSize Initialize
* Documentations: https://www.jacklmoore.com/autosize/
*/
autosize($this.get(0));
that.events.init($this);
});
};
/**
* Events Object
*/
that.events = {
/**
* Initialize all the events.
*/
init : function( $element ) {
/**
* AutoSize can't calculate the textarea height when its not visible so
* we need to update its height every time we display it.
*/
$('#homepageTab #EditWebsiteText #homepageCollapse88').on('show.bs.collapse', function ( event ) {
var $homepageCollapse88 = $('#homepageCollapse88');
var $homepageTitlesContainer = $homepageCollapse88.find('> .homepage-titles-container');
var $wizardTabContent = $('#wizardBox .tab-content');
$homepageTitlesContainer.appendTo($wizardTabContent);
$element.css({ maxHeight: that.minContentHeight });
that.update($element.get(0));
$homepageTitlesContainer.appendTo($homepageCollapse88);
});
/**
* Minimum Content Height Handler - We was needed a "medium" height feature
* because we like out textarea to be at bigger default height when he have
* more content, to handle that we use to focus and blue events.
*/
$element.on('focus.textarea_auto_increase_height', function ( event ) {
$element.css({ maxHeight: that.maxContentHeight });
that.update($element.get(0));
}).on('blur.textarea_auto_increase_height', function ( event ) {
$element.css({ maxHeight: that.minContentHeight });
that.update($element.get(0));
});
},
/**
* Initialize all the events.
*/
off : function( element ) {
that.elements.off('.textarea_auto_increase_height');
}
};
/**
* The function triggers the height adjustment for the sent textarea
* element. Use update method after you reveal the textarea element.
*/
that.update = function( element ) {
autosize.update(element);
};
return that;
}();
/**
* The function is adding the discount to the modal #upgradePackage
*/
function addDiscountToUpgradeModal( websiteID , data ) {
$('#upgradePackage .discount-message').empty();
if (data.saleReducedNUM == 0 || data.saleExpiry == '') return;
var html = '';
html += '<div class="text-center" style="">';
html += '<h4 style="font-size: 14px;">'+ translations.limitedTimeOffer +'</h4>';
html += '<div style="margin: 9px auto;width: 193px;padding: 11px;border: 3px dotted;text-align:center;background-color: #fff;font-size: 17px;font-weight: bold;">' + translations.DiscountOFF.replace('{{discount_percentage}}',data.saleReducedNUM) + '</div>';
html += '<h4 class="saleExpiry" style="color:red;font-size: 14px;">'+data.saleExpiry+'</h4>';
html += '</div>';
$('#upgradePackage .discount-message').append(html);
/**
* jQuery Countdown Initialize
* Documentations: http://hilios.github.io/jQuery.countdown/
*/
$("#upgradePackage .saleExpiry").countdown(ConvertUtcToLocalTime($(".saleExpiry").html())).on('update.countdown', function(event) {
var format = '%H:%M:%S';
if(event.offset.totalDays == 1) {
format = '%-d '+translations.day+' ' + format;
}
if(event.offset.totalDays > 1) {
format = '%-d '+translations.days+' ' + format;
}
if(event.offset.weeks == 1) {
format = '%-w '+translations.week+' ' + format;
}
if(event.offset.weeks > 1) {
format = '%-w '+translations.weeks+' ' + format;
}
$(this).html(event.strftime(format));
});
}
function randomNumberFromRange(min,max) {
return Math.floor(Math.random()*(max-min+1)+min);
}
/**
* The function get the X latest edited websites and update
* the quick dashboard tab (the function will not display the
* current website using by the user).
**/
function latestUpdatedWebsites() {
$.post( '/versions/'+versionNUM+'/wizard/include/getLatestEditedWebsitesAJAX.php', {
w: websiteID,
agencyID: agencyID
}).done( function( latestWebsites ) {
latestWebsites = JSON.parse(latestWebsites);
if ( latestWebsites.length <= 1 ) return;
var html = '<div class="col-xs-12">';
html += '<h3 class="header">'+translations.latestEditedWebsites+'</h3>';
html += '</div>';
$.each(latestWebsites, function( index, website ) {
if ( website.id == websiteID ) return true;
html += '<div class="col-xs-12">';
html += '<a href="/manager/wizard.php?w='+website.id+'&v='+versionNUM+'&from=sites&agencyID='+agencyID+'">';
html += '<div class="qd-site-preview">';
html += '<div class="qd-site-preview-back-image" style="background-image: url('+website.screenshot+'"></div>';
html += '<div class="qd-site-name">';
html += '<b>'+website.name+'</b>';
html += '</div>';
html += '</div>';
html += '</a>';
html += '</div>';
});
var $html = $(html);
$('#quickDashboardLatestWebsites').append($html.hide().fadeIn(600));
});
}
function LayoutPickupManager() {
var template = $('#template').val();
var header_width = $('#header_width').val();
var header_opacity = $('#header_opacity').val();
var header_style = $('#header_style').val();
var header_size = $('#header_size').val();
var header_logo_back_color = $('#header_logo_back_color').val();
var menu_pages_style = $('#menu_pages_style').val();
var menu_font_size = $('#menu_font_size').val();
var header_font_style = $('#header_font_style').val();
var header_width_BOX = $('#header_width').closest('.form-group');
var website_background_color_BOX = $('#website_background_color').closest('.form-group');
var website_background_type = $('#website_background_type').closest('.form-group');
var website_background_color_image_BOX = $('#website_background_color_image').closest('.form-group');
var header_opacity_BOX = $('#header_opacity').closest('.form-group');
var header_style_BOX = $('#header_style').closest('.form-group');
var header_size_BOX = $('#header_size').closest('.form-group');
var header_logo_back_color_BOX = $('#header_logo_back_color').closest('.form-group');
var menu_pages_style_BOX = $('#menu_pages_style').closest('.form-group');
var menu_font_size_BOX = $('#menu_font_size').closest('.form-group');
var header_font_style_BOX = $('#header_font_style').closest('.form-group');
header_width_BOX.hide();
website_background_color_BOX.hide();
website_background_type.hide();
website_background_color_image_BOX.hide();
header_opacity_BOX.hide();
header_style_BOX.hide();
header_size_BOX.hide();
header_logo_back_color_BOX.hide();
menu_pages_style_BOX.show();
menu_font_size_BOX.show();
header_font_style_BOX.show();
$('#header_width option[value="box"]').show();
$('#header_opacity option[value="full"]').show();
$('#header_opacity option[value="slight"]').show();
if (layoutArr[template].menuPlace=='left' || layoutArr[template].menuPlace=='right') {
header_style_BOX.show();
header_size_BOX.show();
}
if (layoutArr[template].menuPlace=='top') {
header_width_BOX.show();
header_size_BOX.show();
header_opacity_BOX.show();
if (header_width=='fullbox' || header_width=='flyfullbox') {
if ( $('#website_background_color_image').val() === '' ) {
website_background_color_BOX.show();
}
website_background_type.show();
website_background_color_image_BOX.show();
}
}
if (layoutArr[template].menuPlace=='bottom') {
header_width_BOX.hide();
$('#header_width').val('wide');
if (template==20) {
header_opacity_BOX.hide();
$('#header_opacity').val('no');
} else {
header_opacity_BOX.show();
}
}
if (template==13) {
header_width_BOX.hide();
$('#header_width').val('wide');
header_opacity_BOX.hide();
$('#header_opacity').val('full');
}
if (template==2) {
header_opacity_BOX.hide();
$('#header_opacity').val('no');
header_logo_back_color_BOX.show();
$('#header_width option[value="box"]').hide();
}
if (template==25) {
header_style_BOX.hide();
menu_pages_style_BOX.hide();
menu_font_size_BOX.hide();
header_font_style_BOX.hide();
}
if (header_width=='flyfullbox') { //we disable it because of PARALLAX bug
$('#header_opacity').val('no');
$('#header_opacity option[value="full"]').hide();
$('#header_opacity option[value="slight"]').hide();
header_opacity_BOX.hide();
}
GetMenuScrollOffset(template);
}
function PrintStylesLayoutLog() {
var homepage_goal = $('#homepage_goal').val();
var homepage_structure = 104;
var title1 = ($('#home_siteSlogan').val()=='') ? '0' : '1';
var title2 = ($('#home_siteSlogan_2').val()=='') ? '0' : '1';
var title3 = ($('#home_SecondSiteSlogan').val()=='') ? '0' : '1';
var more_settings_arr = [
'customTemplate',
'websiteStructureNUM',
'template',
'header_width',
'header_size',
'header_logo_back_color',
'header_font_style',
'menu_pages_style',
'menu_font_size',
'footer_layout',
'home_opacity',
'homepageFilterImage',
'header_opacity',
'header_style',
'home_third_background_color',
'homepageGradientsColors',
'homepage_goal',
'home_slider_image_1',
'home_slider_image_1_settings',
'home_slider_image_2',
'home_slider_image_2_settings',
'home_slider_image_3',
'home_slider_image_3_settings',
'home_slider_image_4',
'home_slider_image_4_settings',
'home_slider_image_5',
'home_slider_image_5_settings',
'home_slider_chaning_speed',
'home_text_size',
'home_text_size_2',
'slogan_text_size',
'home_text_size_weight',
'home_text_size_2_weight',
'slogan_text_size_weight',
'home_text_shadow_1',
'home_text_shadow_2',
'home_text_shadow_3',
'home_text_background_1',
'home_text_background_2',
'home_text_background_3',
'home_text_letter_spacing_1',
'home_text_letter_spacing_2',
'home_text_letter_spacing_3',
'home_text_word_spacing_1',
'home_text_word_spacing_2',
'home_text_word_spacing_3',
'home_text_rotate_1',
'home_text_rotate_2',
'home_text_rotate_3',
'home_text_line_height_1',
'home_text_line_height_2',
'home_text_line_height_3',
'home_text_bottom_space_1',
'home_text_bottom_space_2',
'home_text_bottom_space_3',
'homepage_style',
'home_background_color',
'home_text_color',
'home_text_animation_1',
'home_text_animation_2',
'home_text_animation_3',
'home_siteSlogan',
'home_siteSlogan_2',
'home_SecondSiteSlogan',
'font_slogan',
'font_slogan_2',
'font_second_slogan',
'home_buttonText',
'home_buttonText_style',
'home_buttonText_type',
'home_scrollSection',
'home_buttonText_icon',
'home_buttonText_1',
'home_buttonText_1_style',
'home_buttonText_1_type',
'home_scrollSection_1',
'home_buttonText_1_icon',
'videoType',
'home_video',
'home_custom_video',
'homepageTextCustomBoxStyle',
'global_main_color',
'menu_color',
'menu_text_color',
'menu_text_hover_color',
'menu_thin_border',
'module_separate_border_color',
'modules_color',
'modules_color_text',
'modules_color_box',
'modules_color_text_box',
'modules_color_second',
'modules_color_text_second',
'modules_color_second_box',
'modules_color_text_second_box',
'footer_back',
'footer_text',
'buttons_radius',
'all_fonts',
'homepageShapeDivider',
'homepageShapeDividerList_Color1',
'homepageShapeDividerList_Size',
'homepageShapeDividerList_Mobile',
'homepage_layout_kind',
'layout_text_align',
'layout_text_position',
'layout_homepage_full_width',
'layout_text_box_width',
'layout_left_side_width',
'layout_bottom_spacing',
'homepage_goal_space',
'homepage_second_goal_space',
'homepage_layout_height',
'homepage_goal_type',
'homepage_goal_place',
'homepage_goal_position',
'homepage_second_goal_type',
'homepage_second_goal_place',
'home_custom_image',
'home_custom_image_size',
'home_upload_sound',
'video_popup_icon_style',
'home_embed_sound_cloud',
'embed_url_width_sound_cloud',
'embed_url_height_sound_cloud',
'home_embed_facebook_like_box',
'embed_url_width_facebook',
'embed_url_height_facebook',
'home_embed_twitter',
'embed_url_width_twitter',
'embed_url_height_twitter',
'home_embed_pinterest',
'embed_url_width_pinterest',
'embed_url_height_pinterest',
'videoType',
'home_video',
'home_custom_video',
'homepage_video_max_width',
'homepage_form_style',
];
console.log('\n' +
'$x = xxxxxxxx; \n' +
'$stylesModulesArr[$x] = array(); \n' +
'$stylesModulesArr[$x][\'id\']               = $x; \n' +
'$stylesModulesArr[$x][\'order\']            = $themeIndex; \n' +
'$stylesModulesArr[$x][\'categories\']       = \'cat-popular\'; \n' +
'$stylesModulesArr[$x][\'more_settings\']      = \''+BuildJsonStringWizard(more_settings_arr)+'\'; \n' +
'$themeIndex++; \n' +
'');
}
function PrintTextLayoutLog() {
var homepage_goal = $('#homepage_goal').val();
var homepage_structure = 104;
var title1 = ($('#home_siteSlogan').val()=='') ? '0' : '1';
var title2 = ($('#home_siteSlogan_2').val()=='') ? '0' : '1';
var title3 = ($('#home_SecondSiteSlogan').val()=='') ? '0' : '1';
var more_settings_arr = [
'home_text_size',
'home_text_size_2',
'slogan_text_size',
'home_text_size_weight',
'home_text_size_2_weight',
'slogan_text_size_weight',
'home_text_shadow_1',
'home_text_shadow_2',
'home_text_shadow_3',
'home_text_background_1',
'home_text_background_2',
'home_text_background_3',
'home_text_letter_spacing_1',
'home_text_letter_spacing_2',
'home_text_letter_spacing_3',
'home_text_word_spacing_1',
'home_text_word_spacing_2',
'home_text_word_spacing_3',
'home_text_line_height_1',
'home_text_line_height_2',
'home_text_line_height_3',
'home_text_bottom_space_1',
'home_text_bottom_space_2',
'home_text_bottom_space_3',
'home_text_animation_1',
'home_text_animation_2',
'home_text_animation_3',
'home_text_rotate_1',
'home_text_rotate_2',
'home_text_rotate_3',
'home_siteSlogan',
'home_siteSlogan_2',
'home_SecondSiteSlogan',
'font_slogan',
'font_slogan_2',
'font_second_slogan',
'home_buttonText',
'home_buttonText_style',
'home_buttonText_1',
'home_buttonText_1_style',
'videoType',
'home_video',
'home_custom_video'
];
console.log('\n' +
'$x = xxxxxxxx; \n' +
'$textModulesArr[$x] = array(); \n' +
'$textModulesArr[$x][\'id\']               = $x; \n' +
'$textModulesArr[$x][\'order\']            = $themeIndex; \n' +
'$textModulesArr[$x][\'categories\']       = \'cat-popular\'; \n' +
'$textModulesArr[$x][\'showTitle1\']       = \''+title1+'\'; \n' +
'$textModulesArr[$x][\'showTitle2\']       = \''+title2+'\'; \n' +
'$textModulesArr[$x][\'showTitle3\']       = \''+title3+'\'; \n' +
'$textModulesArr[$x][\'align\']            = \'center\'; \n' +
'$textModulesArr[$x][\'more_settings\']    = \''+BuildJsonStringWizard(more_settings_arr)+'\'; \n' +
'$textModulesArr[$x][\'customClass\']    = \''+$('#homepageTextCustomBoxStyle').val()+'\'; \n' +
'$themeIndex++; \n' +
'');
}
/**
* Wizard modal breadcrumbs handler - The function is creating
* breadcrumbs in the modal header.
*/
function EditPage() {
$('#moduleWindow').on('show.bs.modal',function() {
var $breadcrumb = $(this).find('.container.breadcrumb-custom');
var deviceType = $('html').data('device');
switch( deviceType ) {
case 'computer':
var $nav = $(this).find('#moduleSideMenu');
var $li = $nav.find('li:not(.dividerSubTitle)');
var text = function() {
var t = '';
$nav.find('li.active').each(function() {
var $this = $(this);
if ( $this.children('.submenu').length !== 0 ) return;
t = $this.find('.menu-text').text();
return false;
});
return t;
}();
selectBreadCrumb($breadcrumb,$nav.find('li.active'),text);
$li.on('click',function( e ) {
if ( $(this).parents('ul').hasClass('submenu') ) e.stopPropagation();
text = $(this).find('.menu-text').first().text();
selectBreadCrumb($breadcrumb,$(this),text);
});
$breadcrumb.find('.moduleBredHome').on('click',function() {
$li.first().find('a').trigger('click');
});
break;
case 'mobile':
var $nav = $(this).find('#moduleMobileBottomMenu');
var $a = $nav.find('a');
var text = $nav.find('a.custom-active').find('.menu-text-container').text();
selectBreadCrumb($breadcrumb,$nav.find('a.custom-active'),text);
$a.on('click',function() {
text = $(this).find('.menu-text-container').text();
selectBreadCrumb($breadcrumb,$(this),text);
});
$breadcrumb.find('.moduleBredHome').on('click',function() {
$a.first().trigger('click');
});
break;
}
});
/**
* The function is adding the page that the user is accessing
* to the bread crumb of the modal `#moduleWindow`.
*
* @param {object} $breadcrumb - Bread crumb container.
* @param {object} $li - The active tab that the user clicked on.
* @param {string} text - The active text that the user clicked on.
*/
function selectBreadCrumb( $breadcrumb, $li, text ) {
if ( !text ) return;
$breadcrumb.find('.breadcrumb-custom').remove();
$breadcrumb.append('<li class="breadcrumb-custom active">'+text+'</li>');
}
}
var imageFilterArr = [];
imageFilterArr.push(["10,#000000,#ffffff,0"]);
imageFilterArr.push(["5,#000000,#ffffff,0"]);
imageFilterArr.push(["7,#000000,#ffffff,0"]);
imageFilterArr.push(["7,#000000,#ffffff,sepia(50%) contrast(80%) brightness(100%) saturate(2)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(110%) brightness(110%) sepia(30%) grayscale(100%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(85%) brightness(100%) saturate(75%) sepia(22%)"]);
imageFilterArr.push(["7,#000000,#ffffff,sepia(30%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) brightness(70%) saturate(0.5)"]);
imageFilterArr.push(["7,#000000,#ffffff,blur(3.0px)"]);
imageFilterArr.push(["7,#000000,#ffffff,blur(7.0px)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) brightness(100%) saturate(130%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(90%) brightness(100%) saturate(85%) hue-rotate(20deg)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(90%) brightness(100%) saturate(100%) hue-rotate(-10deg)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) sepia(50%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(90%) brightness(110%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) saturate(125%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(90%) sepia(20%)"]);
imageFilterArr.push(["7,#000000,#ffffff,brightness(100%) hue-rotate(350deg)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(90%) brightness(100%) saturate(110%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) saturate(110%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(95%) brightness(95%) saturate(100%) sepia(25%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(75%) brightness(100%) saturate(85%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) brightness(90%)"]);
imageFilterArr.push(["7,#000000,#ffffff,brightness(100%) saturate(100%) sepia(30%)"]);
imageFilterArr.push(["7,#000000,#ffffff,contrast(100%) brightness(100%) sepia(8%)"]);
/**
* The function is showing the homepage background filter effect options according to the homepage
* background selected type
*/
function filterHomepageOptionsList() {
var mainImageUrl = '';
switch( $('#homepage_style').val() ) {
case '2':
mainImageUrl = $('#home_start_image').val();
BuildFiltersImages(mainImageUrl,imageFilterArr);
break;
case '3':
mainImageUrl = $('#home_slider_image_1').val();
if ( UploadFile_GetFileType(mainImageUrl) == 'video' ) {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getVideoThumbeURL.php",
data: 'w='+$('#id').val()+'&videoURL='+mainImageUrl,
success: function( url ) {
mainImageUrl = url;
if ( mainImageUrl.toLowerCase().indexOf('video-no-thumbnail.png') !== -1 ) {
mainImageUrl = '';
}
BuildFiltersImages(mainImageUrl,imageFilterArr);
}
});
} else {
BuildFiltersImages(mainImageUrl,imageFilterArr);
}
break;
case '4':
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getVideoThumbeURL.php",
data: 'w='+$('#id').val()+'&videoURL='+$('#home_video_background').val()+'',
success: function( url ) {
mainImageUrl = url;
if ( mainImageUrl.toLowerCase().indexOf('video-no-thumbnail.png') !== -1 ) {
mainImageUrl = '';
}
BuildFiltersImages(mainImageUrl,imageFilterArr);
}
});
break;
default:
BuildFiltersImages('',imageFilterArr);
break;
}
}
/**
* The function is building the homepage image filter effect options
*
* @param {string} mainImageUrl - Image url
* @param {array}  imageFilterArr - All filter options
*/
function BuildFiltersImages( mainImageUrl, imageFilterArr ) {
$('.btnSettings[data-relation-id="hmBgFilters"]').hide();
$('#filterHomepageOptions').empty();
if ( !mainImageUrl ) return;
$(imageFilterArr).each(function() {
var html = '';
var string = $(this);
var stringArr = string[0].split(",");
html += '<div data-custom-filter-combination="'+stringArr[0]+stringArr[1]+stringArr[2]+stringArr[3]+'" class="filterEffectClass" style="background-color:'+(stringArr[1])+';" data-opacity="'+stringArr[0]+'" data-back="'+stringArr[1]+'" data-text="'+stringArr[2]+'" data-filter="'+stringArr[3]+'"><img src="'+mainImageUrl.replace('normal_','100_')+'" class="homepageReadyDesignClass" style="color:'+(stringArr[2])+';opacity:'+(stringArr[0]/10)+';filter:'+stringArr[3]+'">';
html += '<div class="filter-button"><i class="ace-icon fa fa-check-circle"></i></div>';
html += '</div>';
$html = $(html);
$('#filterHomepageOptions').append($html);
$html.click(function() {
var $this       = $(this);
var more        = $this.data('more');
var opacity     = $this.data('opacity');
var back        = $this.data('back');
var text        = $this.data('text');
var filter      = $this.data('filter')==0 ? '' : $this.data('filter');
if ( more == 'yes' ) {
$('.hideExtraFilters').fadeToggle();
} else {
$('#home_opacity').val(opacity).trigger('change');
$('#homepageFilterImage').val(filter).trigger('change');
}
ActiveTheFilterTheUserPick();
});
});
$('.btnSettings[data-relation-id="hmBgFilters"]').show();
ActiveTheFilterTheUserPick();
}
function ActiveTheFilterTheUserPick() {
$('#filterHomepageOptions').find('.filterEffectClass').find('.filter-button.active').removeClass('active');
var customFilterCombination = '';
if ($('#home_opacity').val().length>0) {
customFilterCombination += $('#home_opacity').val();
}
if ($('#home_background_color').val().length>0) {
customFilterCombination += $('#home_background_color').val();
}
if ($('#home_text_color').val().length>0) {
customFilterCombination += $('#home_text_color').val();
}
if ($('#homepageFilterImage').val().length>0) {
customFilterCombination += $('#homepageFilterImage').val();
} else {
customFilterCombination += '0';
}
$('#filterHomepageOptions .filterEffectClass[data-custom-filter-combination="'+customFilterCombination+'"]').find('.filter-button').addClass('active');
}
function ResetAllTextSettings() {
$('#home_text_animation_1').val('');
$('#home_text_animation_2').val('');
$('#home_text_animation_3').val('');
$('#home_text_size_weight').val('');
$('#home_text_size_2_weight').val('');
$('#slogan_text_size_weight').val('');
$('#home_text_shadow_1').val('');
$('#home_text_shadow_2').val('');
$('#home_text_shadow_3').val('');
$('#home_text_background_1').val('');
$('#home_text_background_2').val('');
$('#home_text_background_3').val('');
$('#home_text_letter_spacing_1').val('');
$('#home_text_letter_spacing_2').val('');
$('#home_text_letter_spacing_3').val('');
$('#home_text_word_spacing_1').val('');
$('#home_text_word_spacing_2').val('');
$('#home_text_word_spacing_3').val('');
$('#home_text_line_height_1').val('');
$('#home_text_line_height_2').val('');
$('#home_text_line_height_3').val('');
$('#home_text_bottom_space_1').val('');
$('#home_text_bottom_space_2').val('');
$('#home_text_bottom_space_3').val('');
}
/**
* If the user is not connected then show
* him a message with a redirect to login
* page button.
*/
function userNotConnectedMessage() {
if ( $('.login-error-message').length > 0 ) return;
bootbox.dialog({
title: translations.loginErrorTitle,
message: '<div class="login-error-message">' + translations.loginErrorMessage + '<div>',
buttons: {
confirm: {
label: translations.loginBtn,
className: 'btn-primary',
callback: function (result) {
if ( result ) {
disableLeavePopup = true;
var currentLocation = window.location.href.split('/');
window.location = '/manager/login/login.php?p=/' + currentLocation[3] + '/' + currentLocation[4];
}
}
}
}
});
}
function UpdateSubDomainAndUniqueDomainIndifferentPlaceInInterfaceAfterUpdate() {
$.post( '/versions/'+versionNUM+'/wizard/include/getWebsiteDomains.php', {
w: $('#id').val()
}).done( function( data ) {
data = JSON.parse(data);
$('#domainTab_subDomain').html(data[0].websiteSubDomain);
$('#domainTab_subDomain').attr('href','http://'+data[0].websiteSubDomain);
websiteDomain       = data[0].websiteDomain;
unique_domain       = data[0].unique_domain;
websiteSubDomain    = data[0].websiteSubDomain;
});
}
/**
* Send scan sitemap page request to the search engines. We sending
* this request only once until the user will refresh his wizard.
*/
function SendScanSitemapRequest() {
if ( window.isScanSitemapSubmitted ) return;
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/scanSitemapRequest.php",
data: 'w='+$('#id').val(),
success: function( data ) {
if ( data == 'succeed' ) window.isScanSitemapSubmitted = true;
}
});
}
/**
* Modal Unsaved Changes Handler - The function check if the user have unsaved changes
* for the sent modal and alert the user about that.
*/
function is_unsave_changes( $modal, $iframe, event ) {
if ( $modal.length === 0 || $iframe.length === 0 ) return false;
/* at pages like `about` we redirect to the server side and then close the pop-up, at those cases the jQuery is not loaded so we bypass those cases, we also don't need to do nothing because the user already saved changes at that case */
if ( !$iframe.get(0).contentWindow.$ ) return false;
var no_unsaved_changes = $iframe.get(0).contentWindow.$('html[data-unsaved-changes="true"]').length === 0;
/* if there is no unsaved changes we check if we have unsaved changes also in our
iframe inner iframes, at some modules we use it, e.g. gallery when editing image */
if ( no_unsaved_changes ) {
(function () {
$($iframe.get(0).contentWindow.$.find('iframe')).each(function ( index, iframe ) {
var $iframe = $(iframe);
/* check if the iframe is at the same origin, if its not we will get
the next error "Blocked a frame with origin" */
if ( $iframe.attr('src').slice(0,1) === '/' ) {
if ( $iframe.contents().find('html[data-unsaved-changes="true"]').length !== 0 ) {
no_unsaved_changes = false;
return;
}
}
});
})();
}
if ( no_unsaved_changes ) return false;
if ( $modal.data('allow-close') == '1' ) {
$modal.data('allow-close','0');
return false;
}
event.preventDefault();
bootbox.confirm({
title: translations.AreSureCloseWin,
message: translations.PleaseMakeSaveChangeBefore,
className: 's123-unsaved-changes-alert',
buttons: {
confirm: {
label: translations.DiscardChanges,
className: 'btn-danger'
},
cancel: {
label: translations.Cancel,
className: 'btn-default'
}
},
callback: function( discard_changes ) {
if ( discard_changes ) {
$modal.data('allow-close','1');
$modal.modal('hide');
}
}
});
return true;
}
/**
* The function is showing the recommended colors or filters after the user is selecting an image and also
* it is resetting the user homepage text color, filter effect, background color
*
* @param {boolean} fromLibraryBOO - Is user selecting image in library
* @param {jq object} $imageParentDiv - The parent we append the loading icon
* @param {string} previewURL - Image preview url
* @param {string} imageURL - Image url
* @param {jq object} $thisParent - The parent we append the recommended colors / filters
* @param {string} imgBgType - Homepage image background type images / patterns
*/
function homepage_PickNewObjectToHomepageBackground( fromLibraryBOO, $imageParentDiv, previewURL, imageURL, $thisParent, imgBgType ) {
wizard_ClearAllColorsRecommended();
/* exit because sometimes the user can remove the image for example if he selected a color instead of background image
so we don't need to run the rest of the script */
if ( previewURL.length === 0 ) return;
$imageParentDiv.append('<div class="libraryChooseLoading text-center" style="width: 100%;"><i class="ace-icon fa fa-spinner fa-spin white fa-2x"></i></div>');
if ( imageHomepageLiveEleID == Wizard.homePageChangingImages.fistInputID ) {
if ( $('#homepage_layout_kind').val() == '2' || $('#homepage_layout_kind').val() == '3' ) {
homepageHalfWidth_PickNewObjectToHomepageBackground(fromLibraryBOO,$imageParentDiv,previewURL,imageURL,$thisParent,imgBgType);
} else {
homepageFullWidth_PickNewObjectToHomepageBackground(fromLibraryBOO,$imageParentDiv,previewURL,imageURL,$thisParent,imgBgType);
}
} else {
var homepage_style = $('#homepage_style').val();
holdWizardSave = true;
GetRecommendedImages_updateItem(imageURL,homepage_style);
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
$imageParentDiv.find('.libraryChooseLoading').remove();
Wizard.homePageBgOptions.showSavedLabel();
}
}
/**
* The function is responsible for updating only half width homepage structures
*
* @param {boolean} fromLibraryBOO - Is user selecting image in library
* @param {jq object} $imageParentDiv - The parent we append the loading icon
* @param {string} previewURL - Image preview url
* @param {string} imageURL - Image url
* @param {jq object} $thisParent - The parent we append the recommended colors / filters
* @param {string} imgBgType - Homepage image background type images / patterns
*/
function homepageHalfWidth_PickNewObjectToHomepageBackground( fromLibraryBOO, $imageParentDiv, previewURL, imageURL, $thisParent, imgBgType ) {
var homepage_style = $('#homepage_style').val();
if ( fromLibraryBOO == true && imgBgType == 'patterns' ) {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getImageDominantColors_beta.php",
data: 'w='+$('#id').val()+'&image='+encodeURIComponent(previewURL),
success: function( data ) {
data = tryParseJSON(data);
if ( !data ) return;
holdWizardSave = true;
GetRecommendedImages_updateItem(imageURL,homepage_style);
Wizard.homePageBgOptions.updateHomepageImageType(imgBgType);
var imageAttributesResult = GetColorsPaletteArray(data.colors);
if ( data.isTrasperant ) {
imageAttributesResult.styles[1] = {
home_text_color: '#000000',
home_background_color: '#ffffff'
};
}
if ( imageAttributesResult.styles.length > 1 ) {
ActiveNewStyleColor(imageAttributesResult.styles[1]);
}
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
$imageParentDiv.find('.libraryChooseLoading').remove();
Wizard.homePageBgOptions.showSavedLabel();
}
});
} else {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getImageDominantColors_beta.php",
data: 'w='+$('#id').val()+'&image='+encodeURIComponent(previewURL),
success: function( data ) {
data = tryParseJSON(data);
if ( !data ) return;
holdWizardSave = true;
GetRecommendedImages_updateItem(imageURL,homepage_style);
var imageAttributesResult = GetColorsPaletteArray(data.colors);
if ( imageAttributesResult.styles.length > 1 ) {
ActiveNewStyleColor(imageAttributesResult.styles[1]);
if ( fromLibraryBOO == true ) {
PrintImage_colors(imageAttributesResult.styles,$thisParent,6);
$thisParent.css('display','flex');
}
PrintImage_colors(imageAttributesResult.styles,$('#homepageSimilarColorsList'),18);
$('#wizardImageTabColorsRecommended').fadeIn();
}
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
$imageParentDiv.find('.libraryChooseLoading').remove();
Wizard.homePageBgOptions.showSavedLabel();
}
});
}
}
/**
* The function is responsible for updating only full width homepage structures
*
* @param {boolean} fromLibraryBOO - Is user selecting image in library
* @param {jq object} $imageParentDiv - The parent we append the loading icon
* @param {string} previewURL - Image preview url
* @param {string} imageURL - Image url
* @param {jq object} $thisParent - The parent we append the recommended colors / filters
* @param {string} imgBgType - Homepage image background type images / patterns
*/
function homepageFullWidth_PickNewObjectToHomepageBackground( fromLibraryBOO, $imageParentDiv, previewURL, imageURL, $thisParent, imgBgType ) {
var homepage_style = $('#homepage_style').val();
if ( fromLibraryBOO == true && imgBgType == 'patterns' ) {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getImageDominantColors_beta.php",
data: 'w='+$('#id').val()+'&image='+encodeURIComponent(previewURL),
success: function( data ) {
data = tryParseJSON(data);
if ( !data ) return;
holdWizardSave = true;
GetRecommendedImages_updateItem(imageURL,homepage_style);
Wizard.homePageBgOptions.updateHomepageImageType(imgBgType);
var imageAttributesResult = GetColorsPaletteArray(data.colors);
if ( data.isTrasperant ) {
imageAttributesResult.styles[1] = {
home_text_color: '#000000',
home_background_color: '#ffffff'
};
}
if ( imageAttributesResult.styles.length > 1 ) {
ActiveNewStyleColor(imageAttributesResult.styles[1]);
}
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
$imageParentDiv.find('.libraryChooseLoading').remove();
Wizard.homePageBgOptions.showSavedLabel();
}
});
} else {
holdWizardSave = true;
GetRecommendedImages_updateItem(imageURL,homepage_style);
ResetImageDesignAfterChooseNewImage();
holdWizardSave = false;
$('#wizardUndoRefreshHelper').val('wizard_ReloadHomepageCss');
wizard_ReloadHomepageCss();
if ( $thisParent ) PrintImage_quick_filter($thisParent,previewURL);
$imageParentDiv.find('.libraryChooseLoading').remove();
Wizard.homePageBgOptions.showSavedLabel();
}
}
/**
* The function is updating the default design properties of the homepage
* background image / homepage text color / filter effects
*/
function ResetImageDesignAfterChooseNewImage() {
$('#home_opacity').val(5).trigger('change');
$('#homepageFilterImage').val('').trigger('change');
$('#home_background_color').val('#000000').trigger('change');
$('#home_text_color').val('#ffffff').trigger('change');
ActiveTheFilterTheUserPick();
}
function GetRecommendedImages_updateItem( webformatURL, homepage_style ) {
if ( imageHomepageLiveEleID != '' ) {
$('#'+imageHomepageLiveEleID).val(webformatURL).trigger('change',['flag_HomepageChooseGalleryImage']);
filterHomepageOptionsList();
if ( homepage_style !=2 && homepage_style != 3 ) {
$('#homepage_style').val(2).trigger('change');
}
} else {
if ( homepage_style == 3 ) {
$('#home_start_image').val(webformatURL).trigger('change');
$('#home_slider_image_1').val(webformatURL).trigger('change',['flag_HomepageChooseGalleryImage']);
$('#homepage_style').val(3).trigger('change');
} else {
$('#home_start_image').val(webformatURL).trigger('change');
$('#homepage_style').val(2).trigger('change');
}
}
}
function hexToRGB(hex, alpha) {
var r = parseInt(hex.slice(1, 3), 16),
g = parseInt(hex.slice(3, 5), 16),
b = parseInt(hex.slice(5, 7), 16);
if (alpha) {
return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
} else {
return "rgb(" + r + ", " + g + ", " + b + ")";
}
}
/**
* Show the list of available recommended colors
*
* @pararm {array} stylesObj - Colors array
* @pararm {jq object} $eleObj - The colors parent
* @pararm {int} itemLimit - Maximum colors to show
*/
function PrintImage_colors( stylesObj, $eleObj, itemLimit ) {
$eleObj.empty();
var colorI = 1;
$.each(stylesObj, function( index , $colorSettings ) {
if ( colorI <= itemLimit ) {
var recColor = '<div class="item" data-select-color="' + $colorSettings.home_third_background_color + '">';
recColor += '<div class="colorCircle" style="background-color:' + $colorSettings.home_third_background_color + ';"></div>';
recColor += '</div>';
$recColor = $(recColor);
$eleObj.append($recColor);
$recColor.click(function() {
imageHomepageLiveEleID = Wizard.homePageChangingImages.fistInputID;
ActiveNewStyleColor($colorSettings);
SetActiveStatusOnColorsTheUserSelect($(this).data('select-color'));
});
}
colorI++;
});
}
function PrintImage_quick_filter(fastStyleObj,image) {
var filterI = 1;
$.each(imageFilterArr, function( index , filterValue ){
if (filterI<=6) {
var filterArr   = filterValue[0].split(",");
var opacity     = filterArr[0];
var back        = filterArr[1];
var text        = filterArr[2];
var filter      = filterArr[3]==0 ? '' : filterArr[3];
if (opacity>7) {
return true;
}
var recColor = '<div class="item" data-filter="'+filterValue+'">';
recColor += '<div class="colorCircle" style="background-image:url('+image+');background-size: cover;background-position: center center;background-color:'+back+';filter:'+filter+';opacity:'+(opacity/10)+'"></div>';
recColor += '</div>';
$recColor = $(recColor);
fastStyleObj.append($recColor);
$recColor.click(function() {
var filter = $(this).data('filter');
var filterArr = filter.split(",");
var opacity     = filterArr[0];
var back        = filterArr[1];
var text        = filterArr[2];
var filter      = filterArr[3]==0 ? '' : filterArr[3];
$('#home_opacity').val(opacity).trigger('change');
$('#homepageFilterImage').val(filter).trigger('change');
ActiveTheFilterTheUserPick();
});
}
filterI++;
});
fastStyleObj.css('display','flex');
}
function SetActiveStatusOnColorsTheUserSelect(selectedColor) {
$('#RecommendedImages').find('.styles').find('.item.active').removeClass('active');
$('#RecommendedImages').find('.styles').find('.item[data-select-color="'+selectedColor+'"]').addClass('active');
$('#homepageSimilarColorsList').find('.item.active').removeClass('active');
$('#homepageSimilarColorsList').find('.item[data-select-color="'+selectedColor+'"]').addClass('active');
}
/**
* Every image has it's own color design settings and this function is responsible for looping over
* this settings and update the inputs
*
* @param {object} $colorSettings - The color settings
*/
function ActiveNewStyleColor( $colorSettings ) {
holdWizardSave = true;
if ( typeof $colorSettings !== 'undefined' && $colorSettings != '' ) {
var uploadFile = topWindow.uploadFiles[imageHomepageLiveEleID];
/* when user is selecting a pattern we are overwriting the settings because the patterns are not looking good
with dark settings */
if ( uploadFile.settings.get().type == 'patterns' ) {
$colorSettings.home_opacity = 10;
$colorSettings.homepageFilterImage = '';
}
$.each ($colorSettings, function (key, value) {
if ( key == 'homepageLayout' ) return true;
$('#'+key).val(value).trigger('change');
});
}
holdWizardSave = false;
window.reloadPreviewCSS = ReloadPreviewCSS;
AutoSaveWizard(false,true);
}
function GetImageAttributes() {
var home_start_image = $('#home_slider_image_1').val();
GetImageMainColors(home_start_image.replace('normal_','400_'));
}
function isInt(n) {
return n % 1 === 0;
}
function componentToHex(c) {
var hex = c.toString(16);
return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function wizard_ReloadHomepageCss() {
BuildToolJSON();
if ( IsPreviewAtHomepage() ) {
$("#wizardForm").off('ajaxSuccess').one( 'ajaxSuccess', function( event ) {
UpdatePreviewAreaByAjax([
'#top-section'
], function() {
window.scrollPreview = '#top-section';
scrollToPointInPreview();
});
});
window.reloadPreviewCSS = ReloadPreviewCSS;
AutoSaveWizard(false,true);
} else {
AutoSaveWizard(true,true);
}
}
/**
* The function is clearing all of the recommended previews recommended colors
*/
function wizard_ClearAllColorsRecommended() {
$('#wizardImageTabColorsRecommended').hide();
$('#homepageSimilarColorsList').empty();
$('#RecommendedImages').find('.styles').empty().hide();
}
/**
* Get the main color of the image
*/
function GetImageMainColors( imageURL ) {
wizard_ClearAllColorsRecommended();
/* exit because sometimes the user can remove the image for example if he selected a color instead of background image
so we don't need to run this function */
if ( imageURL.length === 0 ) return;
if ( $('#homepage_layout_kind').val() == '2' || $('#homepage_layout_kind').val() == '3' ) {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/getImageDominantColors_beta.php",
data: 'w='+$('#id').val()+'&image='+encodeURIComponent(imageURL)+'',
success: function( data ) {
data = tryParseJSON(data);
if ( !data ) return;
var imageAttributesResult = GetColorsPaletteArray(data.colors);
if ( imageAttributesResult.styles.length > 1 ) {
PrintImage_colors(imageAttributesResult.styles,$('#homepageSimilarColorsList'),18);
$('#wizardImageTabColorsRecommended').fadeIn();
}
}
});
}
}
/* If we use image from Unsplash or pixbay or liveCiy patterns we like to upload
them to our own servers so we make sure that if they fail to load we will still serve them forever */
var UploadLibraryImageToUserWebsite_currentRequest = null;
var UploadLibraryImageToUserWebsite_userFinishChooseImages;
/**
* The function is uploading the selected unsplash / pixabay / patterns from LiveCity
* to the user website folder
*
* @pararm {string} id - Upload file input id
*/
function UploadLibraryImageToUserWebsite( id ) {
var eleVal = $('#'+id).val();
clearTimeout(UploadLibraryImageToUserWebsite_userFinishChooseImages);
/**
* Download to user website folder:
* 1. enter-system.com - homepage background patterns
* 2. unsplash.com - homepage background images
* 3. pixabay.com - homepage background images
*/
if ( eleVal.indexOf('enter-system.com') !== -1 || eleVal.indexOf('unsplash.com') !== -1 || eleVal.indexOf('pixabay.com') !== -1 ) {
UploadLibraryImageToUserWebsite_userFinishChooseImages = setTimeout(function() {
UploadLibraryImageToUserWebsite_currentRequest = $.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/uploadFileFromURL.php",
data: 'w='+$('#id').val()+'&url='+encodeURIComponent(eleVal)+'',
beforeSend: function() {
if ( UploadLibraryImageToUserWebsite_currentRequest != null ) {
UploadLibraryImageToUserWebsite_currentRequest.abort();
}
},
success: function( data ) {
var json = $.parseJSON(data);
$('#'+id).val(json.n);
AutoSaveWizard(false,false);
WizardUndoRedoHandler.skipSave = true;
}
});
},5000);
} else {
if ( UploadLibraryImageToUserWebsite_currentRequest !== null ) {
UploadLibraryImageToUserWebsite_currentRequest.abort();
}
}
}
/**
* If we like to make actions after a file is upload we use this function (only if the user set it, it will work)
*/
function UploadFileFinishUpload_callback( id ) {
if ( id.indexOf('home_slider_image') < 0 ) return;
GetImageMainColors($('#'+id+'').val().replace('normal_','400_'));
UploadLibraryImageToUserWebsite(id);
ResetImageDesignAfterChooseNewImage();
filterHomepageOptionsList();
if ( UploadFile_GetFileType($('#'+id+'').val()) != 'video' ) {
WizardAddImagesToHistory.add($('#'+id+'').val().replace('normal_','400_'),$('#'+id+'').val());
}
}
function GetColorsPaletteArray(json) {
var imageAttributesResult = [];
imageAttributesResult['styles'] = [];
$(json).each(function (index, color) {
var mainColor = color.hex;
var bestTextColorFit = invertColor(mainColor,true);
var imageAttributes_builder_styles = [];
imageAttributes_builder_styles['home_text_color'] = bestTextColorFit;
imageAttributes_builder_styles['home_third_background_color'] = mainColor;
imageAttributes_builder_styles['homepageFilterImage'] = "";
imageAttributesResult['styles'].push(Object.assign({}, imageAttributes_builder_styles));
});
return imageAttributesResult;
}
/**
* For any color return what is the best text color to use (black or white)
*
* Solution: https://stackoverflow.com/a/35970186
*
* @pararm {string} hex - The color we want the get opposite color from
* @pararm {boolean} bw - Decide whether to invert to black or white
*/
function invertColor(hex, bw) {
if (hex.indexOf('#') === 0) {
hex = hex.slice(1);
}
if (hex.length === 3) {
hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
}
if (hex.length !== 6) {
throw new Error('Invalid HEX color.');
}
var r = parseInt(hex.slice(0, 2), 16),
g = parseInt(hex.slice(2, 4), 16),
b = parseInt(hex.slice(4, 6), 16);
if (bw) {
return (r * 0.299 + g * 0.587 + b * 0.114) > 186
? '#000000'
: '#FFFFFF';
}
r = (255 - r).toString(16);
g = (255 - g).toString(16);
b = (255 - b).toString(16);
return "#" + padZero(r) + padZero(g) + padZero(b);
}
/**
* The function is returning all of the settings array as json in string format
*
* @param  {object} settingsArray - Array that contains all the settings we need to populate
* @return {string} unamed - String of the json format after it was populated with values
*/
function BuildJsonStringWizard( settingsArray ) {
var json = {};
for ( var i =0 ; i < settingsArray.length ; i++ ) {
var id = settingsArray[i];
var $input = $('#'+id);
var $inputVal  = $input.val();
/**
* check input type and get the correct value or property according to the input type
* for more methods to check the input type: https://stackoverflow.com/a/3165569
*/
if (id=='home_siteSlogan' || id=='home_siteSlogan_2' || id=='home_SecondSiteSlogan') {
$inputVal = $inputVal.replace(/\n/ig,"<br>");
}
switch ( $input.prop('type') ) {
case 'checkbox':
json[settingsArray[i]] = $input.prop('checked');
break;
default:
json[settingsArray[i]] = $inputVal;
break;
}
}
return JSON.stringify(json);
}
/**
* The function is handling the refresh types by the variable wizardUndoRefreshHelper.
*
* Note: If the variable `wizardUndoRefreshHelper` is empty it will loop over the changed inputs and
* detect what type of refresh we need to show the user.
*
* @param {array}  $changedInputs - All inputs that were changed.
* @param {string} wizardUndoRefreshHelper - The refresh type we need to show.
*/
function WizardRefreshHandler( $changedInputs, wizardUndoRefreshHelper ) {
var inputChangeReload = [];
var refreshByData = [];
var inputChangeLive = [];
var inputReloadPreviewCSS = [];
/**
* Manually Refresh Handler - At some cases we use `holdWizardSave=true` to change
* multiple inputs at ones to prevent multiple saving & reloading. At those cases
* we need to bypass the reload so we use a helper to do it related to the reload
* type we use at any of the functions that use it.
*/
if ( wizardUndoRefreshHelper === 'wizard_ReloadHomepageCss' ) {
wizard_ReloadHomepageCss();
return;
} else if ( wizardUndoRefreshHelper === 'structuresHandler' ) {
$("#wizardForm").off('ajaxSuccess').one( 'ajaxSuccess', function( event ) {
UpdatePreviewAreaByAjax('structuresHandler');
});
AutoSaveWizard(false,true);
return;
}
if ( $changedInputs.length === 0 ) return;
$.each($changedInputs, function( index, $input ) {
if ( $input.hasClass('inputChangeLive') ) {
inputChangeLive.push($input);
} else if ( $input.hasClass('inputChangeReload') ) {
inputChangeReload.push($input);
} else if ( $input.hasClass('inputReloadPreviewCSS') ) {
inputReloadPreviewCSS.push($input);
/* some inputs like upload file have also reload behave but they don't have the class `inputChangeReload`
so we added manual check specifically for them because we could not change at the moment the classes of this inputs because it is risky
at the moment and this kind of change we need to make additional QA.
Note: in the future if we want we can fix that just by adding this inputs the class `inputChangeReload` and remove this check */
} else if ( $input.hasClass('file-upload-input-field') ) {
inputChangeReload.push($input);
}
if ( $input.data('update-preview-area') ) {
refreshByData.push($input.data('update-preview-area'));
}
});
$("#wizardForm").off('ajaxSuccess').one( 'ajaxSuccess', function( event ) {
if ( inputChangeReload.length > 0 ) {
isPreviewReload = true;
RefreshPreview();
return;
}
if ( refreshByData.length > 0 ) {
if ( refreshByData.indexOf('structuresHandler') != -1 ) {
UpdatePreviewAreaByAjax('structuresHandler');
} else {
refreshByData = refreshByData.filter(function(item, pos) {
return refreshByData.indexOf(item) == pos;
});
UpdatePreviewAreaByAjax(refreshByData);
}
}
});
if ( inputReloadPreviewCSS.length > 0 ) {
window.reloadPreviewCSS = ReloadPreviewCSS;
}
AutoSaveWizard(false,true);
for ( i=0; i < inputChangeLive.length ; i++ ) {
window.scrollPreview = inputChangeLive[i].data('scroll-preview');
ChangePreviewLive(inputChangeLive[i].get(0));
}
}
/**
* Fonts select plugin
*/
function s123fontsSelect() {
var that = this;
/**
* The method is initializing the fonts plugin
*
* @param {settings} settings - Plugin settings
*/
that.init = function( settings ) {
if ( !settings ) return;
that.$container = settings.$container;
that.id = settings.id;
that.value = settings.value ? settings.value : '';
that.italicElID = settings.italicElID;
that.websiteFonts = settings.websiteFonts;
that.translations = settings.translations;
that.isFontsLimited = settings.isFontsLimited;
that.$originalEl = settings.$originalEl;
that.demoSelector = settings.demoSelector;
/* get jquery objects because we need to add events to them
and we would like to improve performances */
that.$html = $(generateHtml());
that.$searchInput = that.$html.find('#searchInput');
that.$hiddenInput = that.$html.find('#'+that.id);
that.$fontsList = that.$html.find('.fonts-list');
that.$noResult = that.$html.find('.no-result');
that.$originalEl.replaceWith(that.$html);
that.$demoEl = $(that.demoSelector);
$('<label class="selected-font-text">: <span style="font-family:'+that.value+'">'+that.value+'</span></label>').insertBefore(that.$html);
that.$fontsList.find('.fonts-item').on('click', function() {
that.$hiddenInput.val($(this).data('value')).trigger('change');
});
addPluginAbilities();
if ( that.isFontsLimited ) {
if ( that.$html.find('.more-fonts-upgrade-box').length !== 0 ) return;
that.$container.append('<div class="more-fonts-upgrade-box" style="padding: 5px"><a class="btn btn-block btn-primary" onclick="upgradeFeaturesManager.show(\'moreFonts\');"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="crown" class="svg-inline--fa fa-crown fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="flex-shrink: 0; color: #fee188; margin-bottom: 3px;"><path fill="currentColor" d="M528 448H112c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h416c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm64-320c-26.5 0-48 21.5-48 48 0 7.1 1.6 13.7 4.4 19.8L476 239.2c-15.4 9.2-35.3 4-44.2-11.6L350.3 85C361 76.2 368 63 368 48c0-26.5-21.5-48-48-48s-48 21.5-48 48c0 15 7 28.2 17.7 37l-81.5 142.6c-8.9 15.6-28.9 20.8-44.2 11.6l-72.3-43.4c2.7-6 4.4-12.7 4.4-19.8 0-26.5-21.5-48-48-48S0 149.5 0 176s21.5 48 48 48c2.6 0 5.2-.4 7.7-.8L128 416h384l72.3-192.8c2.5.4 5.1.8 7.7.8 26.5 0 48-21.5 48-48s-21.5-48-48-48z"></path></svg>&nbsp;<span>'+that.translations.moreFontsUpgradeMsg+'</span></a></div>');
}
disableEnableItalic();
};
/**
* The method is reseting the plugin to the default state.
*/
that.reset = function() {
that.$searchInput.val('');
that.$fontsList.find('.font-group').show();
that.$fontsList.find('.font-group').children().show();
that.$noResult.hide();
};
/**
* The function is adding the plugin abilities such as search, load fonts, custom change event to the hidden input.
*/
function addPluginAbilities() {
that.$searchInput.on('input', function( event ) {
var $this = $(this);
search($this.val());
});
that.$hiddenInput.on('change.font_changed', function() {
that.$fontsList.find('.fonts-item').removeClass('active');
that.$fontsList.find('[data-value="'+$(this).val()+'"]').addClass('active');
that.$container.find('.selected-font-text').html(': <span>'+$(this).val()+'</span>');
that.$container.find('.selected-font-text span').attr('style','font-family:'+$(this).val());
disableEnableItalic();
});
that.$hiddenInput.on('change.demo_element_update', function() {
that.$demoEl.val($(this).val());
});
that.$container.closest('.buttonSettingBox').on('settings_box_handler.show', function() {
loadFonts();
that.reset();
});
}
/**
* The function is responsible for disabling or enabling the italic icon
*/
function disableEnableItalic() {
var $element = that.$fontsList.find('.active');
var fontGroup = $element.parent().data('value');
var family = $element.data('value');
var isItalic = 0;
var $italicEl = $('.h-f-i-handler[data-original-el-id="'+that.italicElID+'"]');
var tooTipText = '';
if ( !that.websiteFonts[fontGroup] ) return;
$.each(that.websiteFonts[fontGroup], function( index, font ) {
if ( family == font.name ) {
isItalic = font.italic;
return false;
}
});
if ( isItalic == 1 ) {
$italicEl.removeClass('disabled');
tooTipText = translations.italic.supported;
} else {
$(that.italicElID).val('').trigger('change');
$italicEl.addClass('disabled');
tooTipText = translations.italic.notSupported;
}
/**
* In order to change the tootip text after the initialization we need to use `data-original-title`
* Solution: http://queirozf.com/entries/change-a-tooltip-s-text-after-initialization-in-bootstrap
*/
$italicEl.attr('data-original-title',tooTipText);
$italicEl.tooltip({
delay: {
show: 500,
hide: 0
},
container: 'body',
placement: 'auto'
});
}
/**
* The function is loading the fonts file
*/
function loadFonts() {
if ( $('link.g-f-loaded').length !== 0 ) return;
var link = '<link class="g-f-loaded" href="//fonts.googleapis.com/css?family={{fontsList}}" rel="stylesheet" type="text/css">';
var i = 0;
var fontsList = [''];
for ( fontGroup in that.websiteFonts ) {
that.websiteFonts[fontGroup].forEach( function( font ) {
if ($.inArray(font.name, ['Arial', 'Times New Roman', 'Comic Sans MS', 'Impact', 'Tahoma', 'Verdana', 'Courier New'])!='-1') {
return;
}
fontsList[i] += font.name + ':400' + '|';
if ( fontsList[i].length  > 1500 ) fontsList[++i] = '';
});
}
for ( var i = 0 ; i < fontsList.length ; i++ ) {
$('head').append(link.replace("{{fontsList}}", fontsList[i]));
}
}
/**
* The function is generating the fonts html
*/
function generateHtml() {
var html = '';
html += '<div class="s123-fonts">';
html += '<div class="input-group search-fonts-container">';
html += '<input id="searchInput" type="text" class="form-control search-query" placeholder="'+that.translations.fontsSearchPlaceHolder+'">';
html += '<span id="searchFontsIcon" class="fa fa-search form-control-feedback"></span>';
html += '</div>';
if ( that.translations.tooltip ) html += '&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+that.translations.tooltip+'"><i class="glyphicon glyphicon-question-sign"></i></a>';
html += '<div class="fonts-list">';
for ( fontGroup in that.websiteFonts ) {
if ( that.isFontsLimited ) {
html += '<div class="font-group" data-value="'+translations.freeFontsList+'">';
} else {
html += '<div class="font-group" data-value="'+fontGroup+'">';
html += '<label class="font-group-text">'+fontGroup+'</label>';
}
that.websiteFonts[fontGroup].forEach( function( font ) {
html += '<div style="font-family:'+font.name+';" class="fonts-item '+(that.value === font.name ? 'active' : '')+'" data-value="'+font.name+'">'+font.name+'</div>';
});
html += '</div>';
}
html += '<label class="no-result">'+that.translations.fontsSearchNoResult+'</label>';
html += '</div>';
html += '<input type="hidden" name="'+that.id+'" id="'+that.id+'" class="inputReloadPreviewCSS s123-fonts-hidden-input" value="'+that.value+'">';
html += '</div>';
return html;
}
/**
* The function is searching for the selected font and showing it or it will sow no results text.
*
* @param {object} $containers - jQuery object of the containers that we like to search in them.
* @param {string} text - The text that we like to filter according to it.
* @param {object} $noResult - jQuery object of the no result message container.
*/
function search( text ) {
if ( text.length === 0 ) {
that.$fontsList.find('.font-group').show();
that.$fontsList.find('.font-group').children().show();
that.$noResult.hide();
return;
}
text = text.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,'');
that.$fontsList.find('.font-group').hide();
that.$fontsList.find('.font-group').children().hide();
var rex = new RegExp(text, 'i');
/**
* Search for result in the fonts array and look for matches in
* parameter value and the filter array if it has
*/
var result = 0;
$.each(that.websiteFonts,function( fontGroup, font ) {
for( var i = 0; i < font.length ; i++ ) {
if ( rex.test(fontGroup) ) {
that.$fontsList.find('.font-group').filter('[data-value="'+fontGroup+'"]').show();
that.$fontsList.find('.font-group').filter('[data-value="'+fontGroup+'"]').children().show();
result = that.$fontsList.find('.font-group').filter('[data-value="'+fontGroup+'"]').children().length;
} else if ( rex.test(font[i].name) ) {
that.$fontsList.find('.font-group').children('[data-value="'+font[i].name+'"]').parent().show();
that.$fontsList.find('.font-group').children('[data-value="'+font[i].name+'"]').parent().children('.font-group-text').show();
that.$fontsList.find('.font-group').children('[data-value="'+font[i].name+'"]').show();
result++;
}
}
});
result == 0 ? that.$noResult.show() : that.$noResult.hide();
}
return that;
}
/**
* StylesLayoutsPagInation Class
*/
var StylesLayoutsPagInation = new function() {
var that = this;
/**
* Styles PagInation Initialize
*/
that.init = function( settings ) {
if ( !settings ) return;
that.isMobile = settings.isMobile;
that.$container = settings.$container;
that.page = settings.page;
that.inProgress = false;
$('#wizardTab2button').one('click.home_page_load', function() {
addPluginHtml();
getStyles();
});
$('#homepageFiltersButtons > select').on('change.filter_ready_template', function() {
var $this = $(this);
that.filter = $this.find('option:selected').data('filter');
that.filterType = $this.find('option:selected').data('filter-type');
that.$container.find('.unique-styles-container .unique-styles').empty();
that.page = 1;
getStyles();
that.addLoadNextPageAbility();
});
};
/**
* The method is loading the next page of the styles
*/
that.addLoadNextPageAbility = function() {
if ( that.$loadMore ) {
that.$loadMore.on('click.styles_layouts_pag_ination', function() {
if ( that.inProgress ) return;
getStyles();
});
} else {
that.$container.on('scroll.styles_layouts_pag_ination', function( e ) {
var $this = $(this);
var st = $this.scrollTop();
if ( st > ( (that.$container[0].scrollHeight - that.$container[0].offsetHeight) * 0.80 ) ) {
if ( that.inProgress ) return;
getStyles();
}
});
}
};
/**
* The function is fetching the styles by the page number
*/
function getStyles() {
if ( that.inProgress ) return;
changeStatus(true);
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/modules/stylesLayoutArrayGetNextPage.php",
data: {
w: websiteID,
limit: 5,
page: that.page,
filter: that.filter,
filterType: that.filterType
},
success: function( data ) {
data = tryParseJSON(data);
if ( !data ) {
changeStatus(false);
return;
}
if ( data.noResults ) {
changeStatus(false);
if ( that.isMobile ) {
that.$loadMore.off('click.styles_layouts_pag_ination');
that.$loadMore.hide();
} else {
that.$container.off('scroll.styles_layouts_pag_ination');
}
} else {
PrintUniqueStylesLayouts(data.styles,that.$container.find('.unique-styles-container'));
that.page++;
changeStatus(false);
}
}
});
}
/**
* The function is changing the plugin status and it is also hiding and showing the elements
* according to the plugin status
*
* @param {boolean} inProgress - Plugin status
*/
function changeStatus( inProgress ) {
if ( inProgress ) {
that.inProgress = true;
that.$loading.show();
if ( that.isMobile ) that.$loadMore.hide();
} else {
that.inProgress = false;
that.$loading.hide();
if ( that.isMobile ) that.$loadMore.show();
}
}
/**
* The function is adding the plugin html
*/
function addPluginHtml() {
that.$container.append($('<div class="unique-styles-container"><div class="unique-styles"></div></div>'));
that.$loading = $('<div class="styles-loading text-center" style="width: 100%;"><i class="ace-icon fa fa-spinner fa-spin white fa-2x"></i></div>');
that.$container.append(that.$loading);
if ( that.isMobile ) {
if ( $('#loadMore').length !== 0 ) $('#loadMore').remove();
that.$loadMore = $('<div class="load-more-container text-center"><a id="loadMoreStyles" class="btn btn-primary">'+translations.loadmore+'</a></div>');
that.$container.append(that.$loadMore);
}
that.addLoadNextPageAbility();
}
return that;
}();
/**
* The function is responsible for the logo style change event
*/
function logoFontStyleHandler() {
$('#siteLogoStyle').on('change.style_change',function() {
var $selectedOption = $(this).children(':selected');
if ( $selectedOption.data('no-text') ) {
$('#websiteLogoAndName [data-logo-require="text"]:not([data-logo-except="icon"])').hide();
} else {
$('#websiteLogoAndName [data-logo-require="text"]').show();
}
});
if ( $('#siteLogo').val().indexOf('site123-image-icon') !== -1 ) {
$('#siteLogoStyle').trigger('change.style_change');
}
}
/**
* The function is responsible for converting the old homepage font weight tool to the new one
*/
function homepageFontsWeightHandler() {
var $homePageFontWeightHandler = $('.h-f-w-handler');
if ( $homePageFontWeightHandler.length === 0 ) return;
$.each($homePageFontWeightHandler, function( index, handler ) {
var $handler = $(handler);
var $originalEl = $($handler.data('original-el-id'));
$originalEl.parent().addClass('hidden');
$handler.on('click', function() {
if ( $handler.hasClass('active') ) {
$originalEl.val($originalEl.children('[data-is-bold="false"]').val());
} else {
$originalEl.val($originalEl.children('[data-is-bold="true"]').val());
}
$originalEl.trigger('change');
});
/* add custom change event to the original element so the
handler icons will mark as active */
$originalEl.on('change.font_weight', function() {
if ( $originalEl.children(':selected').data('is-bold') ) {
$handler.addClass('active');
} else {
$handler.removeClass('active');
}
});
/* on page load trigger on the `font_weight` because we only want to mark the bold icon
and not all the change event because the full change event will run also the wizard save */
$originalEl.trigger('change.font_weight');
});
}
/**
* The function is responsible for the click event of the italic icons in the homepage
* tab
*/
function homepageFontsItalicHandler() {
var $homePageFontItalicHandler = $('.h-f-i-handler');
if ( $homePageFontItalicHandler.length === 0 ) return;
$.each($homePageFontItalicHandler, function( index, handler ) {
var $handler = $(handler);
var $originalEl = $($handler.data('original-el-id'));
$originalEl.parent().addClass('hidden');
$handler.on('click', function() {
/* exit when the button is disabled because the font don't have italic
note: the class `disabled` is managed from `s123fontsSelect()` */
if ( $handler.hasClass('disabled') ) return;
if ( $handler.hasClass('active') ) {
$originalEl.val($originalEl.children('[data-is-italic="false"]').val());
} else {
$originalEl.val($originalEl.children('[data-is-italic="true"]').val());
}
$originalEl.trigger('change');
});
/* add custom change event to the original element so the
handler icons will mark as active */
$originalEl.on('change.font_italic', function() {
if ( $originalEl.children(':selected').data('is-italic') ) {
$handler.addClass('active');
} else {
$handler.removeClass('active');
}
});
/* on page load trigger on the `font_italic` because we only want to mark the italic icon
and not all the change event because the full change event will run also the wizard save */
$originalEl.trigger('change.font_italic');
});
}
/**
* The function is hiding or showing the explanation video of the tab that the user is
* currently in
*
* Note: In order to keep the video hidden when the user is navigating between accordions we used
* `stop` animation because the events of the accordions are triggered both and we want to show smooth animation
*/
function showHideTabExplanationVideo() {
$.each($('#wizardForm .tab-content .tab-pane'), function() {
var $this = $(this);
$this.find('.accordion-toggle').on('click', function ( event ) {
$this.find('.explanation-video-container').stop().fadeOut();
});
$this.find('.panel-collapse').on('shown.bs.collapse', function ( event ) {
$this.find('.explanation-video-container').stop().fadeOut();
}).on('hidden.bs.collapse', function ( event ) {
$this.find('.explanation-video-container').stop().fadeIn();
});
$this.find('.explanation-video').on('click.show_tour', function( event ) {
event.preventDefault();
ShowTourVideoExplain($(this).data('title'),$(this).data('video'),$(this).data('image-preview'));
});
});
}
/**
* The function is adding ability to show or hide the setting box of the font family
* demo elements
*/
function addShowHideFontFamilySettingBox() {
$('.font-family-demo-container').on('click.show_setting_box', function() {
var $this = $(this);
var $el = $this.find('.ff-demo');
$el.blur();
SettingsBoxHandler($el,$($el.data('s-b-id')));
$this.find('i').removeClass('fa-caret-down').addClass('fa-caret-up');
$($el.data('s-b-id')).one('settings_box_handler.hide', function() {
$this.find('i').removeClass('fa-caret-up').addClass('fa-caret-down');
});
});
}
function FitWizardTextToBox() {
if ($('html').data('device') == 'computer') {
setTimeout(function() {
fitty('.wizardSideTabs > li > a > div > span', {
minSize: 4,
maxSize: 9
});
fitty('#upgradeButtonButton span, #discountButtonButton span, #saleExpiry', {
minSize: 5,
maxSize: 12
});
fitty('#publishWebsiteButton span', {
minSize: 4,
maxSize: 12
});
fitty('#sortable .manageWin span, #homepageAlternativeName_edit span', {
minSize: 5,
maxSize: 10
});
fitty('#savedStatus', {
minSize: 5,
maxSize: 10
});
},100);
}
}var tabletWidth = 768;
var mobileWidth = 375;
var extraSpace = 0;
var windowHeight;
var tabsButtonWidth;
var $previewBox;
$(function() {
$previewBox = $('#previewBox');
if ($previewBox.length>0) {
/**
* Scale Object Initialize
* Note: When the Scale is working good we can move some functions from here
* to the Scale Class and remove the page `wizardPreview.js`.
*/
Wizard.Preview.Scale.init();
wizard_ResizeScreen();
$('#website_desktop_view').click(function() {
website_desktop_view();
});
$('#website_desktop_fit_view').click(function() {
if ( previewFreeSpace() >= mobileWidth ) ShowWizard();
$previewBox
.show()
.css(intrface_align,navTabsPosLeft()+$('#wizardBox').width())
.css({width: preview_SetWidth(previewFreeSpace())});
ChangePreviewLive();
preview_ActiveMenu('desktop_fit');
});
$('#website_tablet_view').click(function() {
if ( previewFreeSpace() >= mobileWidth ) ShowWizard();
$previewBox
.show()
.css(intrface_align,navTabsPosLeft()+$('#wizardBox').width())
.css({width: preview_SetWidth(tabletWidth)});
ChangePreviewLive();
preview_ActiveMenu('tablet');
});
$('#website_mobile_view').click(function() {
if ( previewFreeSpace() >= mobileWidth) ShowWizard();
$previewBox
.show()
.css(intrface_align,navTabsPosLeft()+$('#wizardBox').width())
.css({width: mobileWidth});
ChangePreviewLive();
preview_ActiveMenu('mobile');
});
$(window).resize(function() {
clearTimeout(window.resizedFinished);
window.resizedFinished = setTimeout( function() {
wizard_ResizeScreen();
if( !ace.vars['touch'] ) {
$('#dropdown_preview_button li.active a').trigger('click');
}
Wizard.Preview.Scale.refresh();
}, 500);
});
if ( ace.vars['touch'] && $('#websitePreviewIframe').length === 0 ) {
if ( $('html').data('device') === 'computer' ) {
$('#wizardTab2button').trigger('click');
}
}
}
});
function wizard_ResizeScreen() {
windowHeight = $(window).outerHeight(true);
tabsButtonWidth = $('.wizardSideTabs').width();
var left = navTabsPosLeft();
if ( $('#wizardBox .tab-content').is(":visible") ) {
left += $('#wizardBox').width();
} else {
left += tabsButtonWidth;
}
$previewBox.height(windowHeight);
$('.tabbable.tabs-left').height(windowHeight);
$('.tabbable.tabs-right').height(windowHeight);
$('#wizardBox .wizardSideTabs').height(windowHeight);
$previewBox
.width(preview_SetWidth(9999))
.css(intrface_align,left)
.show();
$('#main-container').height(windowHeight);
/**
* We must use `outerHeight()` otherwise the wizard will get a height that is
* bigger then the window height, the `windowHeight` is getting the height
* using `outerHeight()` so when we set it we also must use `outerHeight()`.
* if we use `height()` it will add the padding & margin because we use
* `box-sizing: border-box;` CSS property and jQuery add that calculations.
*/
$('#wizardBox .tab-content').outerHeight(windowHeight);
Wizard.Preview.Scale.refresh();
}
function website_desktop_view() {
HideWizard();
$previewBox
.show()
.css({width: $('html').width()-tabsButtonWidth})
.css(intrface_align,navTabsPosLeft()+tabsButtonWidth+extraSpace);
preview_ActiveMenu('desktop');
Wizard.Preview.Scale.refresh();
}
function preview_ActiveMenu(tab) {
$('#dropdown_preview_button li').removeClass('active');
$('#website_'+tab+'_view').parent('li').addClass('active');
$previewBox.attr('data-preview-screen',tab);
setTimeout(function() {
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.ResetMoreButton();
}
},1000);
}
function preview_SetWidth(limit) {
if ($('#wizardBox .tab-content').is(":visible")==true) {
var freeSpace = previewFreeSpace();
} else {
var freeSpace = previewFreeSpaceNoWizard();
}
if (freeSpace>limit) {
return limit;
} else {
return freeSpace;
}
}
function previewFreeSpace() {
return $('body').width()-$('#wizardBox').outerWidth(true)-extraSpace;
}
function previewFreeSpaceNoWizard() {
return $('body').width()-$('.wizardSideTabs').outerWidth(true)-extraSpace;
}
function ShowWizard() {
$( "#previewBox" ).stop( true, true );
$('#wizardBox .tab-content').show();
if (previewFreeSpace()<mobileWidth) {
$previewBox.hide();
} else {
if ($previewBox.attr('data-preview-screen')=='desktop_fit' || $previewBox.attr('data-preview-screen')=='desktop') {
$previewBox.show().width(preview_SetWidth(previewFreeSpace()));
preview_ActiveMenu('desktop_fit');
$previewBox.css(intrface_align,navTabsPosLeft()+$('#wizardBox').width());
}
}
if ($('.wizardSideTabs > li.active').length==0) {
$('.wizardSideTabs [data-toggle=mytabs]').first().parent('li').addClass('active');
$('#homepageTab').addClass('active').show();
}
Wizard.Preview.Scale.refresh();
}
function HideWizard() {
$('#wizardBox .tab-content').hide();
Wizard.Preview.Scale.refresh();
}
function navTabsPosLeft() {
if (intrface_align=='left') {
return $('.wizardSideTabs').offset().left;
} else {
return $(window).width()-$('.wizardSideTabs').offset().left-$('.wizardSideTabs').outerWidth();
}
}//Use us to save the moduleTypeNUM we're manage right now
var g_ManageModuleID;
var promoFirstLoadCount = 1;
function LoadModuleFunctions() {
/**
* Reset the global module tool id because we do not manage any tool.
* If we do not reset it, the preview will not reload in some cases that its should be.
* e.g. After adding a new module, After turn on terms or privacy, etc.
* Reproduce: Reload the interface >> Click Manage on a module >> Close the manage by clicking
* on the background >> Click Add Module >> Add a module = The preview will not refresh.
*/
$('#wizardBox').mousedown(function() {
g_ManageModuleID = '';
});
$('#moduleWindow').on('show.bs.modal', function (event) {
var button = $(event.relatedTarget);	// Button that triggered the modal
var moduleID = button.data('moduleid');		// Extract info from data-* attributes
var moduleTypeNUM = button.data('moduletypenum');		// Extract info from data-*
if (moduleID) {
g_ManageModuleID = moduleID;
OpenModuleWindow(moduleID,moduleTypeNUM,'',button);
topWindow.scrollPreview = '#section-'+moduleID;
topWindow.scrollToPointInPreview();
}
SetEnlargeWindow(moduleTypeNUM);
});
$('#moduleWindow').on('hide.bs.modal', function (event) {
var $modal = $(this);
if ( !is_unsave_changes($modal,$('#moduleItemsIframe'),event) ) {
/**
* On external link module we need to update the preview pages menu
* on header and footer with the new URL so we doing that via Ajax.
*/
(function () {
var $module = $('#card_'+g_ManageModuleID+'');
if ( $module.length === 0 ) return;
var moduleTypeNUM = $module.data('moduletypenum');
if ( moduleTypeNUM == '108' ) {
UpdatePreviewAreaByAjax(['#mainNav ul.navPages','footer.global_footer ul.navPages','#header #top-menu .navPages'], '');
}
/* when user is editing eCommerce we also need to update the mobile menu because the user can change a category name
and he will not see the change until the next preview reload */
if ( moduleTypeNUM == '112' ) {
UpdatePreviewAreaByAjax(['#top-menu-mobile'], '');
}
})();
/**
* Prevent saving change when the user change layouts, the system already
* save the changes when the user click on the chosen layout, so we don't
* need to save and reloading his preview again.
*/
if ( $(this).find('#changeStyleModal').length === 0 ) {
AutoSaveWizard(true,true);
}
$('[data-tab-id="pagesTab"]').removeClass('activeWhite');
$('.tabbable.tabs-left').removeClass('highOpacity');
}
});
$('#moduleSettingsWindow').on('show.bs.modal', function (event) {
var button = $(event.relatedTarget);
var moduleID = button.data('moduleid');
var moduleTypeNUM = button.data('moduletypenum');
g_ManageModuleID = moduleID;
var src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/settings.php?w='+$('#id').val()+'&moduleID='+moduleID+'&moduleTypeNUM='+moduleTypeNUM+'';
var modal = $(this);
modal.find('.modal-body').html('<iframe id="moduleSettingsIframe" src="'+src+'" style="width:100%;height:500px;margin: 0;padding: 0;border: none;"></iframe>');
});
$('#mailingWindow').on('show.bs.modal', function (event) {
var modal = $(this);
modal.find('.modal-body').html('<iframe id="mailingIframe" src="/versions/'+versionNUM+'/wizard/mailing/index.php?w='+$('#id').val()+'" style="width:100%;height:500px;margin: 0;padding: 0;border: none;"></iframe>');
});
$('#AddModuleWin').on('show.bs.modal', function (event) {
var modal = $(this);
var button = $(event.relatedTarget); // Button that triggered the modal
var moduleID = button.data('moduleid');
var addToCategory = button.data('moduletypenum') == '78';
mixPanelEvent(false,"User click on add new module button");
/**
* If the user click on the "Add New Module" button related to a category
* we need to add the new module under the category. To do so we are saving
* the category module id in a global variable so we can use it in `AddNewModule()`
* function because we can not send it.
*/
topWindow.addNewModule_parentId = addToCategory ? moduleID : '';
if ( addToCategory ) {
if ( !modal.data('addToCategory') ) modal.data('loaded',false);
} else {
if ( modal.data('addToCategory') ) modal.data('loaded',false);
}
if ( modal.data('loaded') ) return;
modal.data('addToCategory',addToCategory);
modal.data('loaded',true);
modal.find('.modal-body').html('<iframe id="addNewModuleIframe" name="pluginsIframe" src="/versions/'+versionNUM+'/wizard/modules/modulesList.php?w='+websiteID+'&addToCategory='+addToCategory+'" class="modal-xlg-height" style="width:100%;margin:0;padding:0;border:0;"></iframe>');
});
}
function SetEnlargeWindow(moduleTypeNUM) {
$('#moduleWindow').removeClass('enlarge').removeClass('small');
if (moduleTypeNUM==1000 || moduleTypeNUM==108 || !moduleTypeNUM) {
$('.tabbable.tabs-left').addClass('highOpacity');
setTimeout(function() {
$('.modal-backdrop.in').css('opacity','0');
},100);
return;
}
switch (moduleTypeNUM) {
case 115:
$('#moduleWindow').addClass('small');
break;
default:
$('#moduleWindow').addClass('enlarge');
}
setTimeout(function() {
$('.modal-backdrop.in').css('opacity','0.7');
},100);
}
/**
* The function is responsible for adding the side menu ability that
* will navigate the user between the pages.
*
* @param {boolean} mobile - User is managing via mobile or not.
* @param {string}  html - Full modal html content as string.
* @param {object}  modal - The modal that we add the html to.
* @param {string}  src - The page that the iframe need to show.
* @param {integer} heighestHeightNUM - Iframe height.
*/
function ModuleSideMenuClickEvent( mobile, html, modal, src, heighestHeightNUM ) {
html += '<iframe id="moduleItemsIframe" class="module-side-menu" src="'+src+'" style="width:calc(100% - 190px);height:'+heighestHeightNUM+'px;margin: 0;padding: 0;border: none;"></iframe>';
modal.find('.modal-body').html(html);
switch ( mobile ) {
case false:
modal.find('.modal-body .sidebar').ace_sidebar();
$('#moduleSideMenu a').click(function() {
var $this = $(this);
if ($this.data('href') != '#' && $this.data('href') != '' && $this.attr('target') !== '_blank' && $('#moduleItemsIframe')[0].contentWindow.$ && $('#moduleItemsIframe')[0].contentWindow.$('html[data-unsaved-changes="true"]').length>0) {
bootbox.confirm({
title: translations.SureDiscardChanges,
message: translations.PleaseMakeSaveChangeBeforeLeave,
className: 's123-unsaved-changes-alert',
buttons: {
confirm: {
label: translations.DiscardChanges,
className: 'btn-danger'
},
cancel: {
label: translations.Cancel,
className: 'btn-default'
}
},
callback: function( result ) {
if (result) {
moduleSideMenu_action($this);
} else {
}
}
});
return;
}
moduleSideMenu_action($this);
});
$('#moduleSideMenu .side-menu-toggle').click(function() {
if ( $('#moduleSideMenu').hasClass('menu-min') ) {
$('#moduleItemsIframe.module-side-menu').removeClass('extend-iframe-width');
} else {
$('#moduleItemsIframe.module-side-menu').addClass('extend-iframe-width');
}
});
break;
case true:
$('#moduleMobileBottomMenu .sub-tabs').hide();
$('#moduleMobileBottomMenu a').click(function(event) {
var $this = $(this);
if ($this.data('href') != '#' && $this.data('href') != '' && $('#moduleItemsIframe')[0].contentWindow.$ && $('#moduleItemsIframe')[0].contentWindow.$('html[data-unsaved-changes="true"]').length>0) {
bootbox.confirm({
title: translations.SureDiscardChanges,
message: translations.PleaseMakeSaveChangeBeforeLeave,
buttons: {
confirm: {
label: translations.DiscardChanges,
className: 'btn-danger'
},
cancel: {
label: translations.Cancel,
className: 'btn-default'
}
},
callback: function( result ) {
if (result) {
moduleMobileBottomMenu_action($this);
} else {
}
}
});
return;
}
moduleMobileBottomMenu_action($this);
});
$('#moduleMobileBottomMenu .side-menu-toggle').click(function() {
if ( $('#moduleMobileBottomMenu').hasClass('menu-min') ) {
$('#moduleItemsIframe.module-side-menu').removeClass('extend-iframe-width');
} else {
$('#moduleItemsIframe.module-side-menu').addClass('extend-iframe-width');
}
});
break;
}
}
function moduleSideMenu_action($this) {
if ( $this.data('href') != '#' && $this.data('href') != '' ) {
$('#moduleItemsIframe').attr('src',$this.data('href'));
}
if ( $this.closest('.submenu').length === 0 &&  $this.parent().children('.submenu').length === 0 ) {
$('#moduleSideMenu .open .submenu.nav-show').addClass('nav-hide').removeClass('nav-show').hide();
$('#moduleSideMenu .open').removeClass('open');
}
$('#moduleSideMenu li').removeClass('active');
$this.parent('li').addClass('active');
if ( $this.parents('ul').hasClass('submenu') ) {
$this.parents('li').addClass('active');
}
}
function moduleMobileBottomMenu_action( $this ) {
var $subTabs = $this.next();
if ( $this.data('href') != '#' && $this.data('href') != '' ) {
var moduleItemsIframe = document.getElementById('moduleItemsIframe');
moduleItemsIframe.contentWindow.location.replace($this.data('href'));
}
if ( $subTabs.hasClass('sub-tabs') && !$subTabs.is(':visible') ) {
$subTabs.fadeIn();
} else if ( $this.next().hasClass('sub-tabs') && $this.next().is(':visible') ) {
$subTabs.fadeOut();
} else {
$subTabs.find('.sub-tabs').fadeOut();
}
$('#moduleMobileBottomMenu a').removeClass('custom-active');
$this.addClass('custom-active');
}
/**
* The function is showing a specific item edit page or all items edit page of the selected
* module, it is also creating side menu of the module inside of the modal.
*
* @param {string}  moduleID - The module id that the user is editing.
* @param {integer} moduleTypeNUM - The module type number that the user is editing.
* @param {integer} itemID - If the user is editing a specific module item it won't be empty.
* @param {object}  $button - The button that the user has clicked on.
*/
function OpenModuleWindow( moduleID, moduleTypeNUM, itemID, $button ) {
g_ManageModuleID = moduleID;
if (moduleTypeNUM!=1000) {
var title = GetModuleSetting(moduleID,'title');
} else {
var title = translations.Promo;
}
var activeTab = '/'+modulesArr[moduleTypeNUM]['folder']+'/';
if ( moduleTypeNUM == '112' && $button && !$button.data('active-tab') ) {
activeTab = '/eCommerceCollections/';
}
var modal = $('#moduleWindow');
/**
* Custom active tab handler - In some modules we have a custom tab ability which means
* the button can open a specific page editor if the button has the page name in the
* attribute `data-active-tab` for example data-active-tab="design.php".
*
* Note: At the moment we use only in E-commerce module >> design button.
*/
if ( $button && $button.data('active-tab') ) {
activeTab += $button.data('active-tab');
src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/'+$button.data('active-tab')+'?w='+$('#id').val();
} else {
activeTab += 'items.php';
if ( itemID != '' ) {
var src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/addItem.php?w='+$('#id').val()+'&moduleID='+moduleID+'&id='+itemID+'';
var srcMain = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/items.php?w='+$('#id').val()+'&moduleID='+moduleID+'';
} else {
if (moduleTypeNUM=='112') {
var src = '/versions/'+versionNUM+'/wizard/modules/eCommerceCollections/items.php?id=homepageItems&w='+$('#id').val()+'&moduleID='+moduleID+'&moduleTypeNUM=113';
} else {
var src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/items.php?w='+$('#id').val()+'&moduleID='+moduleID+'';
}
}
}
if (modulesArr[moduleTypeNUM]['one_item_module']=='1') {
modal.find('#moduleWindowTitle').html(escapeHtml(title));
} else {
if (itemID!='') {
modal.find('#moduleWindowTitle').html(LinkModuleTitleToPage(moduleTypeNUM,title,srcMain));
} else {
modal.find('#moduleWindowTitle').html(LinkModuleTitleToPage(moduleTypeNUM,title,src));
}
}
var heighestHeightNUM = $(window).outerHeight(true)-85;
/**
* E-commerce collections has moduleTypeNUM 113 but we need to show
* the menu of E-commerce module that has a moduleTypeNUM 112
*/
moduleTypeNUM = moduleTypeNUM == 113 ? 112 : moduleTypeNUM;
if ( modulesArr[moduleTypeNUM]['module_side_menu'] ) {
sideMenu = jQuery.parseJSON(modulesArr[moduleTypeNUM]['module_side_menu']);
if ( $('html').data('device') === 'computer' ) {
html = BuildModuleSideMenu(moduleID,heighestHeightNUM,sideMenu,activeTab);
ModuleSideMenuClickEvent(false,html,modal,src,heighestHeightNUM);
} else {
html = BuildMobileModuleSideMenu(moduleID,heighestHeightNUM,sideMenu,activeTab);
ModuleSideMenuClickEvent(true,html,modal,src,heighestHeightNUM);
}
} else {
modal.find('.modal-body').html('<iframe id="moduleItemsIframe" src="'+src+'" style="width:100%;height:'+heighestHeightNUM+'px;margin: 0;padding: 0;border: none;"></iframe>');
}
}
function OpenFastPromoModule(moduleID,moduleTypeNUM,itemID) {
g_ManageModuleID = moduleID;
if (itemID!='') {
var src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/addItem.php?w='+$('#id').val()+'&moduleID='+moduleID+'&id='+itemID+'';
var srcMain = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/items.php?w='+$('#id').val()+'&moduleID='+moduleID+'';
} else {
var src = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/items.php?w='+$('#id').val()+'&moduleID='+moduleID+'';
}
var modal = $('#moduleWindow');
var heighestHeightNUM = $(window).outerHeight(true)-170;
return '<iframe id="moduleItemsIframe" src="'+src+'" style="width:100%;height:'+heighestHeightNUM+'px;margin: 0;padding: 0;border: none;max-height:400px;"></iframe>';
}
/**
* The function add a filter option to the sent object.
*/
function AddFilterInitialize( objects ) {
var $form = objects.$form;
var $filterInput = objects.$filterInput;
var $filterContainers = objects.$filterContainers;
var $categoriesList = objects.$categoriesList;
var $noResults = objects.$noResults;
var afterFilterCallback = objects.afterFilterCallback ? objects.afterFilterCallback : false;
if ( $categoriesList.is("select") ) {
$categoriesList.change(function() {
filterByCategory($(this).val());
$filterInput.val('');
});
$categoriesList.trigger('change');
} else {
$categoriesList.find('> li').click( function() {
var $this = $(this);
$filterInput.val('');
filterByCategory($this.data('filter'));
$categoriesList.find('li').removeClass('active');
$this.addClass('active');
});
$categoriesList.find('> li').first().click();
}
$form.submit(function(e){ e.preventDefault(); });
var filterInputFinished;
$filterInput.on('input', function() {
if ( !$form.valid() ) return;
$categoriesList.find('> li').removeClass('active');
clearTimeout(filterInputFinished);
filterInputFinished = setTimeout( function() {
filter( $filterContainers, $filterInput.val() );
}, 500);
});
/**
* The function filter the containers list according to the sent category filter.
*
* @param {string} $filter - Category filter.
*/
function filterByCategory( filter ) {
$noResults.hide();
scrollTop();
$filterContainers.hide();
$filterContainers.filter('.' + filter).show();
if ( $filterContainers.filter('.' + filter).length === 0 ) {
$noResults.show();
}
if ( afterFilterCallback ) afterFilterCallback();
};
/**
* The function filter the containers list according to the sent selector & text.
*
* @param {object} $containers - jQuery object of the containers that we like to search in them.
* @param {string} text - The text that we like to filter according to it.
*/
function filter( $containers, text ) {
$noResults.hide();
scrollTop();
if ( text.length === 0 ) {
$categoriesList.is("select") ?
$categoriesList.val($categoriesList.find('option').first().val()).trigger('change') :
$categoriesList.find('> li').first().click();
return;
}
text = text.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '');
text = text.replace(/[.]/gi, '\\.');
$containers.hide();
var rex = new RegExp(text, 'i');
$containers.filter( function () {
return rex.test($(this).text());
}).show().find('.add-page-module-image > img').attr('src',function() { //Make sure to show images with lazy load
return $(this).data('image');
});
if ( $containers.filter(':visible').length === 0 ) {
$noResults.show();
}
if ( afterFilterCallback ) afterFilterCallback();
};
/**
* The function find the element that responsible on the scrollbar and scroll it to top.
*/
function scrollTop() {
if ( $filterContainers.length === 0 ) return;
$filterContainers.scrollParent().scrollTop(0);
};
}
function LinkModuleTitleToPage(moduleTypeNUM,windowName,iframeURL) {
var breadcrumb = '';
breadcrumb += '<div class="breadcrumb-wrap">';
breadcrumb += '<ol class="breadcrumb container breadcrumb-custom">';
breadcrumb += '<li>';
breadcrumb += '<i class="'+modulesArr[moduleTypeNUM]['icon']+'"></i>&nbsp;';
breadcrumb += '<a style="cursor:pointer;" class="moduleBredHome" onclick="redirectModule(\''+iframeURL+'\');">' + windowName+'</a>';
breadcrumb += '</li>';
breadcrumb += '</ol>';
breadcrumb += '</div>';
return breadcrumb;
}
function AddActionInModuleWindow(moduleTypeNUM,moduleID) {
var insideURL;
insideURL = '/versions/'+versionNUM+'/wizard/modules/'+modulesArr[moduleTypeNUM]['folder']+'/'+modulesArr[moduleTypeNUM]['main_add_item']+'?w='+$('#id').val()+'&moduleID='+moduleID+'';
return '<a class="btn btn-primary" onclick="redirectModule(\''+insideURL+'\');">'+translations.add+'</a>';
}
function redirectModule(insideURL) {
$('#moduleItemsIframe').attr('src',insideURL);
}
function LoadModulesLists() {
if ( tools_manage.length === 0 || tools_manage=='') return;
var obj = jQuery.parseJSON(tools_manage);
var zIndex = obj.length;
$.each(obj, function( index, value ) {
var settings 		= (value.settings!='') ? jQuery.parseJSON(value.settings) : ''; //Not all modules have settings
var moduleID 		= value.moduleID;
var moduleTypeNUM 	= value.moduleTypeNUM;
var title 			= value.title;
var style			= value.style;
var modulesArrID	= value.modulesArrID ? value.modulesArrID : '';
var styleContent	= (settings!='' && typeof settings.styleContent !== typeof undefined) ? settings.styleContent : '';
var showInMenu		= value.showInMenu;
var showInFooter	= value.showInFooter;
var hideFrontModule = (settings!='' && typeof settings.hideFrontModule !== typeof undefined) ? settings.hideFrontModule : '';
var mp_showInMenu	= value.mp_showInMenu;
var mp_showInHome	= value.mp_showInHome;
var parentId 		= value.parentId ? value.parentId : '';
AddModule(moduleID,moduleTypeNUM,title,true,style,styleContent,showInMenu,showInFooter,hideFrontModule,mp_showInMenu,mp_showInHome,parentId,zIndex,modulesArrID);
zIndex--;
});
}
/**
* The function disable the option to add a module by clicking it.
* we use it to prevent from the user to add a module multiple
* times by double clicking on the same module.
*
* @param {boolean} disable - True = Disable, False = Enable.
*/
function DisableAddModules( disable ) {
if ( disable ) {
$('.moduleButton').addClass('disableModule');
} else {
$('.moduleButton').removeClass('disableModule');
}
}
/**
* The function add a new category module.
*/
function AddNewModuleCategory() {
if ( PagesLimitations() ) return;
window.addNewModule_parentId = '';
/**
* Documentation: http://bootboxjs.com/examples.html
*
* Generate dialog for the add new category
*/
bootbox.dialog({
title: translations.addNewCategory,
message: '<form id="addNewCategoryForm" class="bootbox-form"><div class="form-group"><input id="addNewCategory" autocomplete="off" type="text" class="bootbox-input bootbox-input-text form-control" required data-msg-required="'+translations.fieldRequired+'"></div></form>',
className: 'wizard-add-new-category',
closeButton: true,
backdrop: true,
onEscape: function() {},
buttons: {
cancel: {
label: translations.Cancel,
className: 'btn-default'
},
confirm: {
label: translations.Save,
className: 'btn-primary btn-success add-new-category-btn',
callback: function() {
var $form = this.find('.bootbox-form');
var $name = $form.find('#addNewCategory');
$name.val($name.val().trim());
if ( !$form.valid() || $name.val().length === 0 ) {
$name.focus();
return false;
}
AddNewModule('78',$name.val(),false,'1','1','1','1','0','1','0','','78');
}
}
},
}).on('shown.bs.modal', function() {
var $addNewCategoryBtn = $(this).find('.add-new-category-btn');
/* when the user is pressing on enter key we need to press the button of the boot box
to add the category instead of submitting the form */
$(this).find('#addNewCategory').onEnterKey(function ( event ) {
event.preventDefault();
$addNewCategoryBtn.trigger('click');
});
});
}
/**
* The function add a new module.
*/
function AddNewModule(moduleTypeNUM, name, firstLoad, style, styleContent, showInMenu, showInFooter, hideFrontModule, mp_showInMenu, mp_showInHome, parentId, modulesArrID) {
DisableAddModules(true);
var moduleID = uniqid();
/**
* For now only in E-commerce there is such a index
* and it need a static moduleID because this module can't
* exist more then 1 time in the website
*/
if (modulesArr[moduleTypeNUM]['staticModuleID']) {
moduleID = modulesArr[moduleTypeNUM]['staticModuleID'];
}
/**
* If the user click on the "Add New Module" button related to a category
* we need to add the new module under the category. To do so we are using
* the global targeted category module id parameter that we saved, we also
* reseting it for the next time the user add a new module.
*/
if ( window.addNewModule_parentId ) {
parentId = window.addNewModule_parentId;
window.addNewModule_parentId = '';
}
AddModule(moduleID,moduleTypeNUM,name,firstLoad,style,styleContent,showInMenu,showInFooter, hideFrontModule,mp_showInMenu,mp_showInHome,parentId,-1,modulesArrID);
}
/**
* The function add a module new/exit modules to the DOM, new modules are
* first added to the data-base and exist are added to the DOM.
*/
function AddModule(moduleID, moduleTypeNUM, name, firstLoad, style, styleContent, showInMenu, showInFooter, hideFrontModule, mp_showInMenu, mp_showInHome, parentId, zIndex, modulesArrID) {
if ( firstLoad == false ) {
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/modules/addNewModule.php",
data: {
w: $('#id').val(),
moduleID: moduleID,
parentId: parentId,
title: name,
moduleTypeNUM: moduleTypeNUM,
style: style,
modulesArrID: modulesArrID,
styleContent: styleContent,
showInMenu: showInMenu,
showInFooter: showInFooter,
hideFrontModule: hideFrontModule,
mp_showInMenu: mp_showInMenu,
mp_showInHome: mp_showInHome,
slogan: '',
modulesArrID: modulesArrID,
language: $('#language').val()
},
success: function(data) {
var data = jQuery.parseJSON(data);
AddModuleHTML(moduleID,moduleTypeNUM,name,firstLoad,style,modulesArrID,styleContent,showInMenu,showInFooter,hideFrontModule,mp_showInMenu,mp_showInHome,data.url,parentId,zIndex);
/**
* Some modules have settings like E-commerce so we need to set the default
* value to `tools_manage` after adding the HTML of the module
*/
if ( modulesArr[Number(moduleTypeNUM)]['settings'] ) {
EditModuleSetting(moduleID,'settings',modulesArr[Number(moduleTypeNUM)]['settings']);
}
}
});
} else {
AddModuleHTML(moduleID,moduleTypeNUM,name,firstLoad,style,modulesArrID,styleContent,showInMenu,showInFooter,hideFrontModule,mp_showInMenu, mp_showInHome,'',parentId,zIndex);
}
}
/**
* The function add the module HTML to the DOM.
*/
function AddModuleHTML(moduleID, moduleTypeNUM, name, firstLoad, style, modulesArrID, styleContent, showInMenu, showInFooter, hideFrontModule, mp_showInMenu, mp_showInHome, url, parentId, zIndex) {
var html = '';
html += '<li id="card_'+moduleID+'" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-moduleid="'+escapeHtml(moduleID)+'" data-module-show-in-menu="'+escapeHtml(showInMenu)+'" data-module-show-in-footer="'+escapeHtml(showInFooter)+'" data-module-hide-front-module="'+escapeHtml(hideFrontModule)+'" data-module-mp-show-in-menu="'+escapeHtml(mp_showInMenu)+'" data-module-mp-show-in-home="'+escapeHtml(mp_showInHome)+'" data-module-style="'+escapeHtml(style)+'" data-modules-arr-id="'+escapeHtml(modulesArrID)+'" data-module-style-content="'+escapeHtml(styleContent)+'" href="#" class="moduleSortList list-group-item well" data-url="'+url+'" data-parent-id="'+parentId+'" style="z-index:'+zIndex+'">';
html += '<div class="boxClick"></div>';
html += '<div class="pages_PageBox">';
if( 1 ) {
html += '<div class="pages_dragButton">';
html += '<a class="draggingModuleButton" data-module-id="'+escapeHtml(moduleID)+'" data-parent-module="'+escapeHtml(moduleTypeNUM)+'" data-rel="tooltip" title="'+escapeHtml(translations.DragThePageToAnotherPage)+'" data-delay=\'{"show":"1000", "hide":"0"}\'><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="grip-vertical" class="svg-inline--fa fa-grip-vertical fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M96 32H32C14.33 32 0 46.33 0 64v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zM288 32h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32z"></path></svg></a>';
html += '</div>';
}
html += '<div class="pages_buttonsBox">';
html += '<div class="input-group">';
if ( moduleTypeNUM == 1000 ) { //PROMO modules can't change the text in the input
html += '<div class="btn-group"><input type="text" class="form-control input-sm ignore promoModuleInput" value="'+translations.Promo + ' ' + promoFirstLoadCount+'" readonly data-rel="tooltip" title="'+escapeHtml(translations.PromoPageNameCannotChange)+'" data-delay=\'{"show":"500", "hide":"0"}\'><input type="text" class="form-control input-sm module_name data-hj-whitelist ignore hidden" placeholder="'+escapeHtml(translations.title)+'" data-moduleid="'+escapeHtml(moduleID)+'" maxlength="100" aria-label="Module Name"></div>';
promoFirstLoadCount++;
} else {
html += '<div class="btn-group"><input type="text" class="form-control input-sm module_name data-hj-whitelist ignore" placeholder="'+escapeHtml(translations.title)+'" data-moduleid="'+escapeHtml(moduleID)+'" maxlength="100" aria-label="Module Name"></div>';
}
if ( moduleTypeNUM == '78' ) {
html += '<div class="btn-group"><a class="btn btn-mini btn-primary no-radius manageWin" data-toggle="modal" data-target="#AddModuleWin" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-moduleid="'+escapeHtml(moduleID)+'" data-name="'+escapeHtml(name)+'" data-rel="tooltip" title="'+escapeHtml(translations.addNewPage)+'" data-delay=\'{"show":"1000", "hide":"0"}\'><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" class="svg-inline--fa fa-plus fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg></a></div>';
} else {
if ( moduleTypeNUM == 1000 && false ) {
html += '<div class="btn-group"><a class="btn btn-mini btn-primary no-radius modulesEditButton promoEditWin" data-moduleid="'+escapeHtml(moduleID)+'" data-parent-module="'+escapeHtml(moduleTypeNUM)+'" data-rel="tooltip" title="'+escapeHtml(translations.UpdateManageContent)+'" data-delay=\'{"show":"1000", "hide":"0"}\'>'+translations.edit+'</a></div>';
} else {
html += '<div class="btn-group"><a class="btn btn-mini btn-primary no-radius modulesEditButton manageWin" data-toggle="modal" data-target="#moduleWindow" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-moduleid="'+escapeHtml(moduleID)+'" data-name="'+escapeHtml(name)+'" data-rel="tooltip" title="'+escapeHtml(translations.UpdateManageContent)+'" data-delay=\'{"show":"1000", "hide":"0"}\'><div><span>'+translations.edit+'</span></div></a></div>';
}
if ( modulesArr[moduleTypeNUM]['custom_design'] ) {
html += '<div class="btn-group">';
html += '<a class="btn btn-mini btn-primary no-radius customDesignModuleButton manageWin" data-toggle="modal" data-target="#moduleWindow" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-module-id="'+escapeHtml(moduleID)+'" data-name="'+escapeHtml(name)+'" data-active-tab="'+modulesArr[moduleTypeNUM]['custom_design']+'" data-rel="tooltip" title="'+escapeHtml(translations.ChangeLayoutDesignOfPage)+'" data-delay=\'{"show":"1000", "hide":"0"}\'>';
html += '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="palette" class="svg-inline--fa fa-palette fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"></path></svg>';
html += '</a>';
html += '</div>';
} else if ( !(moduleTypeNUM==36 && style==1) && !(moduleTypeNUM==80) ) {
html += '<div class="btn-group"><a class="btn btn-mini btn-primary no-radius designModuleButton manageWin" data-module-id="'+escapeHtml(moduleID)+'" data-parent-module="'+escapeHtml(moduleTypeNUM)+'" data-rel="tooltip" title="'+escapeHtml(translations.ChangeLayoutDesignOfPage)+'" data-delay=\'{"show":"1000", "hide":"0"}\'><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="palette" class="svg-inline--fa fa-palette fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"></path></svg></a></div>';
}
}
html += '<div class="btn-group"><a class="btn btn-mini btn-primary no-radius manageWin module-settings-button-container" data-rel="tooltip" title="'+escapeHtml(translations.ChooseWhereLocate)+'" data-delay=\'{"show":"1000", "hide":"0"}\'><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="cog" class="svg-inline--fa fa-cog fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path></svg></a></div>';
html += '</div>';
html += '</div>';
html += '<div class="pages_RemoveButtons smallManageIcons">';
html += '<div class="hideIconInPages"><span class="fa fa-eye-slash" data-rel="tooltip" title="'+escapeHtml(translations.Your_page_is_hide_from_users)+'" data-delay=\'{"show":"1000", "hide":"0"}\'></span></div>';
html += '<a data-rel="tooltip" title="'+(moduleTypeNUM == '78' ? escapeHtml(translations.removeCategory) : escapeHtml(translations.removePage))+'" data-delay=\'{"show":"1000", "hide":"0"}\' data-toggle="confirmation-delete-module" class="cards_buttons delete" data-moduleid="'+escapeHtml(moduleID)+'"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="trash" class="svg-inline--fa fa-trash fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path></svg></a>';
html += '</div>';
html += '</div>';
if ( moduleTypeNUM == '108' ) {
html += '<div class="external-link-module-msg">';
html += '<span>'+translations.externalLinkModuleMsg+'</span>';
html += '</div>';
}
html += '</li>';
var $list = $('#sortable');
if ( parentId.length !== 0 ) {
var $parent = $('#card_'+parentId);
if ( $parent.length !== 0 ) {
$list = $parent.children('ul');
if ( $list.length === 0 ) $list = $('<ul></ul>').appendTo($parent);
}
}
var $module = $(html).appendTo($list);
FitWizardTextToBox();
Wizard.Pages.refresh();
if ( moduleTypeNUM != '78' ) {
$module.addClass('mjs-nestedSortable-no-nesting');
}
/**
* Initial Bootstrap Tooltip - Active tool-tip for the new added page.
* Note: tool-tips are not supported on touch devices when they used on
* a buttons, links, etc. The click event doesn't works good on IOS, and
* on other devices its show the tool-tip and not closing it.
*/
if ( !ace.vars['touch'] ) {
$('.moduleSortList [data-rel=tooltip]').tooltip({
container: 'body'
});
}
var $moduleName = $module.find('.module_name');
$module.data('moduleid',moduleID);
$moduleName.val(name);
if (modulesArr[Number(moduleTypeNUM)] && modulesArr[Number(moduleTypeNUM)]['module_kind']=='3') {
$module.find('.module-settings-button-container').remove();
}
if (modulesArr[Number(moduleTypeNUM)] && modulesArr[Number(moduleTypeNUM)]['module_kind']=='5') {
$module.find('.designModuleButton').remove();
}
/**
* Delete Button
* Bootstrap Confirmation Plugin Initial
* Documentation : https://ethaizone.github.io/Bootstrap-Confirmation/
*/
$module.find('[data-toggle="confirmation-delete-module"]').confirmation({
placement: ace.vars['touch'] ? intrface_align : intrface_align_reverse,
title: (moduleTypeNUM != '78' ? translations.areYouSure : translations.areYouSureCat),
btnOkLabel: '<i class="icon-ok-sign icon-white"></i> '+translations.yes+'',
btnCancelLabel: '<i class="icon-remove-sign"></i> '+translations.no+'',
popout: true,
singleton: true,
container: 'body',
btnOkClass: 'btn-danger btn-sm spacing-confirmation-btn',
btnCancelClass: 'btn-default btn-sm spacing-confirmation-btn',
delay: 0,
onConfirm: function() {
RemoveModule($(this));
}
});
/**
* When the user press the Enter key on the module name input it was
* opening the Preview Drop-down Menu. Its happen because we didn't
* added a `type="button"` to the preview drop-down button. We fix it
* but we also preventing the issue from happen in the future.
* http://stackoverflow.com/questions/23668996/bootstrap-dropdown-always-get-focused-when-pressing-enter-key-in-form
*/
$moduleName.keydown( function( event ) { if ( event.which === 13 ) return false; });
$moduleName.on('input', function() {
clearTimeout($moduleName.inputFinished);
$moduleName.inputFinished = setTimeout( function() {
if ( Wizard.Preview.ready ) {
Wizard.Preview.$('#section-'+moduleID+'-title').html(escapeHtml($moduleName.val()));
GetModuleSetting(moduleID,'url');
/**
* When the manage is changing the module
* name we need to make sure that the
* preview page name will be updated at the following
* styles: 1 and 2
*/
if ( moduleID == 112 ) {
var settings = GetModuleSetting(moduleID,'settings');
settings = tryParseJSON(settings);
if ( settings.menuStyle != 3 ) {
updateModuleName(Wizard.Preview.$('li[data-menu-module-id="'+moduleID+'"] > a').first(),escapeHtml($moduleName.val()));
}
} else {
updateModuleName(Wizard.Preview.$('li[data-menu-module-id="'+moduleID+'"] > a'),escapeHtml($moduleName.val()));
}
}
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/convertTextToUrl.php",
data: 'text='+encodeURIComponent($moduleName.val())+'', // serializes the form's elements.
success: function( pageURL ) {
var prevURL = GetModuleSetting(moduleID,'url');
if ( pageURL.length === 0 ) pageURL = moduleID;
pageURL = CheckPageURLinsideJSON(moduleID,pageURL);
if ( Wizard.Preview.ready ) {
Wizard.Preview.$('a[href*="'+prevURL+'"]').each(function() {
if ( !this.href ) return;
if ( this.href.indexOf('/'+prevURL+'/') !== -1 ) {
this.href = this.href.replace('/'+prevURL+'/','/'+pageURL+'/');
return;
}
if ( this.href.indexOf('/'+prevURL+'?') !== -1 ) {
this.href = this.href.replace('/'+prevURL+'?','/'+pageURL+'?');
return;
}
});
}
BuildToolJSON();
isWizardChange = true;
isPreviewReload = false;
}
});
},300);
});
$module.find('.module-settings-button-container').click( function( event ) {
var $settingButton = $(this);
var moduleTypeNUM = $module.data('moduletypenum');
Wizard.Pages.highlight.on($module);
ReloadPreviewAndGoToModule(moduleID,false);
var $popoverContent = $('<div class="form-group" style="margin-bottom:5px;"></div>');
if ( $('.popover.modules-setting').data('module-id') == $module.data('moduleid') ) return false;
if ( IsSinglePage() ) {
if ( $module.data('parent-id').length === 0 ) {
$popoverContent.append('<div class="checkbox"><label class="block"><input id="page_showInMenu" type="checkbox" class="page-navigation-checkbox"><span class="lbl">&nbsp;'+escapeHtml(translations.showOnMenu)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.showOnPagesMenu)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div><div class="checkbox"><label class="block"><input disabled type="checkbox" class="page-navigation-checkbox" checked><span class="lbl" style="opacity:0.5;">&nbsp;'+escapeHtml(translations.showOnHomepage)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.shownOnHomepageSinglePage)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
$popoverContent.find('#page_showInMenu').prop('checked',$module.data('module-show-in-menu') == '1');
}
} else {
if ( $module.data('parent-id').length === 0 ) {
$popoverContent.append('<div class="checkbox"><label class="block"><input id="page_mp_showInMenu" type="checkbox" class="page-navigation-checkbox"><span class="lbl">&nbsp;'+escapeHtml(translations.showOnMenu)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.shownOnSeperatedPage)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
$popoverContent.find('#page_mp_showInMenu').prop('checked',$module.data('module-mp-show-in-menu') == '1');
}
if ( moduleTypeNUM != '78' ) {
if ( moduleTypeNUM == '108' ) {
$popoverContent.append('<div class="checkbox" style="color:#ddd"><label class="block"><input id="page_mp_showInHome" type="checkbox" class="page-navigation-checkbox" disabled><span class="lbl">&nbsp;'+escapeHtml(translations.showOnHomepage)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.shownOnHomepage)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
} else {
$popoverContent.append('<div class="checkbox"><label class="block"><input id="page_mp_showInHome" type="checkbox" class="page-navigation-checkbox"><span class="lbl">&nbsp;'+escapeHtml(translations.showOnHomepage)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.shownOnHomepage)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
}
$popoverContent.find('#page_mp_showInHome').prop('checked',$module.data('module-mp-show-in-home') == '1');
}
}
if ( $module.data('parent-id').length === 0 ) {
$popoverContent.append('<div class="checkbox"><label class="block"><input id="page_showInFooter" type="checkbox" class="page-navigation-checkbox"><span class="lbl">&nbsp;'+escapeHtml(translations.showOnFooter)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.showOnFooterExp)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
$popoverContent.find('#page_showInFooter').prop('checked',$module.data('module-show-in-footer') == '1');
}
if ( moduleTypeNUM != '78' && moduleTypeNUM != '108') {
$('<hr style="margin:2px 0">').appendTo($popoverContent);
$popoverContent.append('<div class="checkbox"><label class="block"><input id="page_HideFrontModule" type="checkbox"><span class="lbl">&nbsp;'+escapeHtml(translations.Hide_page_from_users)+'</span>&nbsp;<a href="#" onclick="return false;" data-rel="tooltip" title="'+escapeHtml(translations.Hide_page_from_users_explain)+'"><i class="glyphicon glyphicon-question-sign"></i></a></label></div>');
$popoverContent.find('#page_HideFrontModule').prop('checked',$module.data('module-hide-front-module') == '1');
}
if ( moduleTypeNUM != '78' && moduleTypeNUM != '108') {
if ( moduleTypeNUM != '112' ) {
$('<hr style="margin:2px 0">').appendTo($popoverContent).css({
visibility: $popoverContent.find('input').length > 0 ? 'visible' : 'hidden'
});
$popoverContent.append('<a id="page_slogan" class="btn btn-link" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-moduleid="'+escapeHtml(moduleID)+'"><i class="ace-icon fa fa-align-justify"></i>&nbsp;'+escapeHtml(translations.slogan)+'</a>');
}
$('<hr style="margin:2px 0">').appendTo($popoverContent).css({
visibility: $popoverContent.find('input').length > 0 ? 'visible' : 'hidden'
});
$popoverContent.append('<a id="page_seo" class="btn btn-link" data-toggle="modal" data-target="#moduleSettingsWindow" data-moduletypenum="'+escapeHtml(moduleTypeNUM)+'" data-moduleid="'+escapeHtml(moduleID)+'"><i class="ace-icon fa fa-search"></i>&nbsp;'+escapeHtml(translations.seo)+'</a>');
$popoverContent.find('#page_seo').click( function( event ) {
destroyPopover();
});
$popoverContent.find('#page_slogan').click( function( event ) {
var moduleid = $module.data('moduleid');
destroyPopover();
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/modules/getSettingsAjax.php",
data: 'w='+$('#id').val()+'&moduleID='+moduleid+'&moduleTypeNUM='+moduleTypeNUM,
success: function(data) {
var data = $.parseJSON(data);
if ( data.status != 'Done' ) return;
/**
* Documentation: http://bootboxjs.com/examples.html
* Generate dialog for the add new category
*/
bootbox.dialog({
title: translations.slogan + '&nbsp;<small>(500)</small>',
message: '<form id="editModuleSloganForm" class="bootbox-form"><div class="form-group"><textarea class="form-control" name="editModuleSlogan" id="editModuleSlogan" placeholder="'+escapeHtml(translations.slogan)+'" maxlength="500">'+data.slogan+'</textarea></div></form>',
className: 'wizard-edit-module-slogan',
closeButton: true,
backdrop: true,
onEscape: function() {},
buttons: {
cancel: {
label: translations.Cancel,
className: 'btn-default'
},
confirm: {
label: translations.Save,
className: 'btn-success',
callback: function() {
var $slogan = this.find('#editModuleSlogan');
g_ManageModuleID = moduleid;
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/modules/saveSloganAjax.php",
data: 'w='+$('#id').val()+'&moduleID='+moduleid+'&moduleTypeNUM='+moduleTypeNUM+'&id='+data.id+'&slogan='+encodeURIComponent($slogan.val()),
success: function(data) {
if ( data == 'Done' ) {
AutoSaveWizard(true,true);
}
}
});
}
}
},
});
}
});
});
}
$popoverContent.find('input').change( function( event ) {
var $input = $(event.target);
/**
* The user is not allow to hide a page from all places. On single page the
* module will always displayed on homepage but on multi page we prevent it.
* External Links also do not display at the homepage so its same as multi-page.
*/
if ( !IsSinglePage() || $module.data('moduletypenum') == '108') {
if ( $popoverContent.find('input.page-navigation-checkbox:enabled').length > 1 &&
$popoverContent.find('input.page-navigation-checkbox:enabled:checked').length === 0 ) {
$input.prop('checked',true).trigger('change');
return false;
}
}
switch ( $input.get(0).id ) {
case 'page_showInMenu':
$module.data('module-show-in-menu',($input.prop('checked') ? '1' : '0'));
break;
case 'page_mp_showInMenu':
$module.data('module-mp-show-in-menu',($input.prop('checked') ? '1' : '0'));
break;
case 'page_mp_showInHome':
$module.data('module-mp-show-in-home',($input.prop('checked') ? '1' : '0'));
break;
case 'page_showInFooter':
$module.data('module-show-in-footer',($input.prop('checked') ? '1' : '0'));
break;
case 'page_HideFrontModule':
$module.data('module-hide-front-module',($input.prop('checked') ? '1' : '0'));
$module.attr('data-module-hide-front-module',($input.prop('checked') ? '1' : '0'));
break;
}
BuildToolJSON();
if ( IsSinglePage() ) {
$("#wizardForm").one( 'ajaxSuccess', function( event ) {
UpdatePreviewAreaByAjax([
'#mainNav ul.navPages',
'footer.global_footer ul.navPages',
'#header #top-menu .navPages'
], function() {
if ( $input.get(0).id == 'page_showInFooter' ) {
window.scrollPreview = 'footer.global_footer ul.navPages';
scrollToPointInPreview();
}
});
});
AutoSaveWizard(false,true);
} else {
AutoSaveWizard(true,true);
}
});
/**
* Bootstrap's Popovers Plugin Initial
* Documentation : http://getbootstrap.com/javascript/#popovers
*/
$settingButton.popover({
container: 'body',
content: $popoverContent,
html: true,
trigger: 'manual',
template: '<div class="popover modules-setting" data-module-id="'+$module.data('moduleid')+'" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
placement: ace.vars['touch'] ? 'auto' : intrface_align_reverse
});
$settingButton.tooltip('destroy');
$settingButton.popover('show');
$settingButton.on('shown.bs.popover', function () {
$('.popover.modules-setting [data-rel=tooltip]').tooltip({
container: 'body',
placement: 'auto'
});
$(document).on('mousedown.pageSettingDestroyPopover', function ( event ) {
if ( $(event.target).closest('.popover.modules-setting').length === 0 ) {
destroyPopover();
}
});
$(window).one('blur.pageSettingDestroyPopover', function( event ) {
destroyPopover();
});
$settingButton.scrollParent().one('scroll.pageSettingDestroyPopover', function( event ) {
destroyPopover();
});
});
/**
* The function destroy the Popover and removes event handlers that were attached to it
*/
function destroyPopover() {
$settingButton.popover('destroy');
$(document).off('mousedown.pageSettingDestroyPopover');
$(window).off('blur.pageSettingDestroyPopover');
$(window).off('scroll.pageSettingDestroyPopover');
}
});
if ( moduleTypeNUM != '78' ) {
$module.find('.modulesEditButton').on('click', function() {
Wizard.Pages.highlight.on($module);
if ( !$module.hasClass('p-active') ) {
ReloadPreviewAndGoToModule(moduleID,false);
}
});
$moduleName.on('click', function() {
Wizard.Pages.highlight.on($module);
ReloadPreviewAndGoToModule(moduleID,false);
});
$module.find('.promoModuleInput').on('click', function() {
$moduleName.trigger('click');
});
$('.promoEditWin[data-moduleid="' + escapeHtml(moduleID) + '"]').click( function( event ) {
g_ManageModuleID = moduleID;
var $li = $('#card_' + escapeHtml(moduleID));
var $promoButton = $(this);
var parentModule = $promoButton.data('parent-module');
var $container  = $('<div class="container-fluid">'+OpenFastPromoModule(moduleID,moduleTypeNUM,'')+'</div>');
var $row = $('<div class="row"></div>').appendTo($container);
/**
* Bootstrap's Popovers Plugin Initial
* Documentation : http://getbootstrap.com/javascript/#popovers
*/
$promoButton.popover({
container: 'body',
content: $container,
html: true,
template: '<div class="popover modules-fast-promo" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
placement: function (context, source) {
if ( ace.vars['touch'] ) return 'auto';
var rtl = ($('html[dir=rtl]').length !== 0 ? true : false);
var ch = 410 + 20;	// 410 = CSS, 20 = parents padding/margin
var $s = $(source);
var bSpace = $(window).height() - ($s.offset().top + $s.outerHeight() + ch);
return (bSpace > 0) ? 'bottom' : rtl ? 'left' : 'right';
}
});
$promoButton.popover('show');
$promoButton.on('shown.bs.popover', function () {
var $promoBackdropManaul = $('<div class="promoBackdropManaul"></div>').appendTo('body');
$('.tabbable.tabs-left').addClass('highOpacity');
$promoBackdropManaul.on('click', function ( event ) {
destroyPopover();
});
});
/**
* The function destroy the Popover and removes event handlers that were attached to it
*/
function destroyPopover() {
$promoButton.popover('destroy');
$('.promoBackdropManaul').remove();
$('.tabbable.tabs-left').removeClass('highOpacity');
}
});
/**
* Custom designer - Modules that has custom designer will open a new window
* with additional options for the module design.
*/
$('.customDesignModuleButton[data-module-id="' + escapeHtml(moduleID) + '"]').click( function( event ) {
var $li = $('#card_' + escapeHtml(moduleID));
var $cusomDesignButton = $(this);
g_ManageModuleID = moduleID;
Wizard.Pages.highlight.on($module);
ReloadPreviewAndGoToModule(moduleID,false);
OpenModuleWindow(moduleID,moduleTypeNUM,'',$(this));
});
$('.designModuleButton[data-module-id="' + escapeHtml(moduleID) + '"]').click( function( event ) {
g_ManageModuleID = moduleID;
Wizard.Pages.highlight.on($module);
ReloadPreviewAndGoToModule(moduleID,false);
var $li = $('#card_' + escapeHtml(moduleID));
var $designButton = $(this);
var parentModule = $designButton.data('parent-module');
var hasStylesContents = typeof modulesArr[parentModule].styleContent === 'object';
var x = '<div id="changeStyleModalAllBox">';
if ( hasStylesContents ) {
x += '<div class="container-fluid">';
x += '<div class="buttonsTabs">';
x += '<div class="tab stylesButton active">'+escapeHtml(translations.Layout_Main)+'</div>';
x += '<div class="tab stylesContentButton">'+escapeHtml(translations.Layout_Content)+'</div>';
x += '</div>';
x += '</div>';
}
x += '<div id="changeStyleModal" style="overflow: scroll;height: 500px;">';
x += '<div class="container-fluid">';
x += '<div class="row modules-design-styles"></div>';
x += '<div class="row modules-design-styles-contents"></div>';
x += '</div>';
x += '</div>';
x += '</div>';
var $container  = $(x);
var $styles = $container.find('.modules-design-styles');
var $stylesContents = $container.find('.modules-design-styles-contents');
$container.find('.stylesButton').click(function() {
ReloadPreviewAndGoToModule(moduleID,false);
$('.buttonsTabs .tab').removeClass('active');
$(this).addClass('active');
$stylesContents.fadeOut(200, function() {
$styles.fadeIn(200);
});
});
$container.find('.stylesContentButton').click(function() {
Wizard.Preview.Redirect.toItem(websiteID,moduleID,moduleTypeNUM);
$('.buttonsTabs .tab').removeClass('active');
$(this).addClass('active');
$styles.fadeOut(200, function() {
$stylesContents.fadeIn(200);
});
});
$stylesContents.hide();
for ( id in modulesArr ) {
var module = modulesArr[id];
if ( ts_site123 == '1' || local_site123 ) module.beta = false;
if ( module.beta ) continue;
/**
* Search for the current module designs in the global modules array.
* module.no_design_change is for PROMO, we don't show all the design
* option because the way we built this tool.
*/
if ( module.parentModule == parentModule && !module.no_design_change ) {
if (module.preview_image=='') {
module.preview_image 	= '/files/images/defaultStyleImage.jpg?v=' + $GLOBALS['v-cache'] +'';
}
var $style = $('<div data-style="' + module.style + '" data-modules-arr-id="' + module.id + '" class="col-xs-12 modules-design-button-container">'
+ '<div class="modules-design-button">'
+ '<img class="modules-design-button-image" src="' + module.preview_image + '?v=' + $GLOBALS['v-cache'] +'">'
+ '<i class="ace-icon fa fa-check-circle"></i>'
+ '</div>'
+ '</div>').appendTo($styles);
if ( module.style == $li.data('module-style') ) {
$style.find('.modules-design-button').addClass('active');
}
$style.click( function( event ) {
var $this = $(this);
$li.data('module-style',$this.data('style'));
$li.data('modules-arr-id',$this.data('modules-arr-id'));
$styles.find('.modules-design-button.active').removeClass('active');
$this.find('.modules-design-button').addClass('active');
BuildToolJSON();
AutoSaveWizard(true,true);
});
}
}
if ( hasStylesContents ) {
var allStyleContent = modulesArr[parentModule].styleContent;
for (var i = 0; i < allStyleContent.length; i++) {
var contentLayout = allStyleContent[i];
if (contentLayout.preview_image=='') {
contentLayout.preview_image 	= '/files/images/defaultStyleImage.jpg?v=' + $GLOBALS['v-cache'] +'';
}
var $styleContent = $('<div data-style-content="' + contentLayout.style + '" class="col-xs-12 modules-design-button-container">'
+ '<div class="modules-design-button">'
+ '<img class="modules-design-button-image" src="' + contentLayout.preview_image + '?v=' + $GLOBALS['v-cache'] +'">'
+ '<i class="ace-icon fa fa-check-circle"></i>'
+ '</div>'
+ '</div>').appendTo($stylesContents);
if ( contentLayout.style == $li.data('module-style-content') ) {
$styleContent.find('.modules-design-button').addClass('active');
}
$styleContent.click( function( event ) {
var $this = $(this);
$li.data('module-style-content',$this.data('style-content'));
$stylesContents.find('.modules-design-button.active').removeClass('active');
$this.find('.modules-design-button').addClass('active');
BuildToolJSON();
AutoSaveWizard(false,true);
Wizard.Preview.Redirect.toItem(websiteID,moduleID,moduleTypeNUM);
});
}
}
/**
* Bootstrap's Popovers Plugin Initial
* Documentation : http://getbootstrap.com/javascript/#popovers
*/
/*
$designButton.popover({
container: 'body',
content: $container,
html: true,
template: '<div class="popover modules-design" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
placement: function (context, source) {
if ( ace.vars['touch'] ) return 'auto';
var rtl = ($('html[dir=rtl]').length !== 0 ? true : false);
var ch = 410 + 20;	// 410 = CSS, 20 = parents padding/margin
var $s = $(source);
var bSpace = $(window).height() - ($s.offset().top + $s.outerHeight() + ch);
return (bSpace > 0) ? 'bottom' : rtl ? 'left' : 'right';
}
});
*/
$('#moduleWindow').modal('show');
$('#moduleWindow .modal-body').html('');
$('#moduleWindow .modal-body').append($container);
$('#moduleWindow #moduleWindowTitle').html(escapeHtml(translations.choosePageLayout));
var heighestHeightNUM = $(window).outerHeight(true)-140;
$('#changeStyleModal').height(heighestHeightNUM);
/*
$designButton.on('shown.bs.popover', function () {
$('<div class="designBackdropManaul"></div>').appendTo('body');
$('.tabbable.tabs-left').addClass('highOpacity');
$(document).on('mousedown.pageDesignDestroyPopover', function ( event ) {
if ( $(event.target).closest('.popover.modules-design').length === 0 ) {
destroyPopover();
}
});
$(window).one('blur.pageDesignDestroyPopover', function( event ) {
destroyPopover();
});
$('.popover.modules-design .popover-title .close').click( function( event ) {
destroyPopover();
});
});
*/
/**
* The function destroy the Popover and removes event handlers that were attached to it
*/
/*
function destroyPopover() {
$designButton.popover('destroy');
$(document).off('mousedown.pageDesignDestroyPopover');
$(window).off('blur.pageDesignDestroyPopover');
$('.designBackdropManaul').remove();
$('.tabbable.tabs-left').removeClass('highOpacity');
}
*/
});
}
if ( firstLoad == false ) {
BuildToolJSON();
if ( IsSinglePage() || IsPreviewAtHomepage() ) {
$("#wizardForm").one( 'ajaxSuccess', function( event ) {
UpdatePreviewAreaByAjax([
'#mainNav ul.navPages',
'#mainNav ul.navActions',		// Forum use client zone
'#s123ModulesContainer',
'footer.global_footer ul.navPages',
'#header #top-menu .navPages'
], function() {
window.scrollPreview = '#section-' + moduleID;
scrollToPointInPreview();
});
});
AutoSaveWizard(false,true);
} else {
window.scrollPreview = '#section-' + moduleID;
AutoSaveWizard(true,true);
}
DisableAddModules(false);
$('#AddModuleWin').modal('hide');
$module.scrollParent().stop().animate({
scrollTop: $module.position().top - $("#sortable").offset().top
}, 500, function() {
$module.data('tmp-an-bg',$module.css('backgroundColor')).stop().animate({
backgroundColor: "#f0ad4e"
},1000, function() {
$module.animate({
backgroundColor: $module.data('tmp-an-bg')
},1000, function() {
$module.css({ backgroundColor: '' });
});
});
});
$(document).trigger('s123.wizardPageAdded');
}
/**
* Search for module that using client zone icon such Events, Pricing table,
* Donate, Simple store, Schedule booking, Forum or E-commerce pages.
*/
if ( $.inArray(moduleTypeNUM,GetModulesListUsingClientZoneIcon()) != -1 ) {
/**
* When adding Events, Pricing table, Donate, Simple store, Schedule booking,
* Forum or E-commerce module we need to enable the client zone icon.
*/
if ( !$('#showHeaderClientZone').prop('checked') ) {
$('#showHeaderClientZone').prop('checked',true).trigger('change');
}
}
}
/**
* The function is updating the module name in the preview and it is also preserving the
* html tags if there is any in the module name.
*
* @param {Jquery object} $modules - The modules that we need to update the names.
* @param {string} newModuleName - New module name we need to set
*/
function updateModuleName( $modules, newModuleName ) {
$modules.each(function( index, module ) {
var $module = $(module);
/* get html entities when the content is mixed with text and html tags
https://stackoverflow.com/a/15458968 */
var prevContent = $.parseHTML($module.html());
var tmpDoc = $(new DOMParser().parseFromString($module.html(),'text/html'));
var elements = tmpDoc.find('body').children();
var txtContainer = elements.filter('.txt-container');
var moduleName = newModuleName;
var template = '{{txt}}&nbsp;{{html}}';
txtContainer.html(moduleName);
moduleName = template.replace('{{txt}}',txtContainer.prop('outerHTML'));
if ( elements.filter(':not(.txt-container)').length > 0 ) {
moduleName = moduleName.replace('{{html}}',elements.filter(':not(.txt-container)').prop('outerHTML'));
} else {
moduleName = moduleName.replace('{{html}}','');
}
$module.html(moduleName);
});
}
function CheckPageURLinsideJSON(m_moduleID,url) {
if ( tools_manage.length > 0 ) {
var modules = jQuery.parseJSON(tools_manage);
modules.forEach( function( module ) {
if (module.url==url && module.moduleID!=m_moduleID) {
url = url+'-1';
url = CheckPageURLinsideJSON(m_moduleID,url);
}
});
modules.forEach( function( module ) {
if ( module.moduleID == m_moduleID ) {
module.url = url;
return;
}
});
tools_manage = JSON.stringify(modules);
}
return url;
}
function RemoveModule($button) {
var $li = $button.closest('li');
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/modules/removeModule.php",
data: {
w: $('#id').val(),
moduleID: $li.data('moduleid')
},
success: function(data) {
Wizard.Preview.closePopups();
$li.fadeOut(250, function() {
/**
* Delete & Update changes related to the website type (single/multi page).
* Note: When we go into the if condition its mean that the preview is
* active and we need to update it, e.g. when a user is in his homepage
* and delete a module, we need to remove it from the preview only if
* the preview is located at his homepage. We also check if the preview
* is ready for 2 cases, one is that sometime its on reloading process
* so we don't need to update it, and the second case is when the user
* manage his website via mobile, so there is no preview.
*/
if ( Wizard.Preview.ready && (IsSinglePage() || IsPreviewAtHomepage()) ) {
/**
* Destroy the Parallax object to remove its mirrors that stays next to
* the `body` tag and related to the removed section tag. the Parallax will
* reinitialize automatically when we call to `.parallax('refresh')`.
*/
if ( Wizard.Preview.ready ) {
Wizard.Preview.window.DestroyParallaxImages();
}
if ( $li.data('moduletypenum') == '78' ) {
$li.find('ul > li').each(function( index, module ) {
Wizard.Preview.getModule($(module).data('moduleid')).remove();
});
} else {
Wizard.Preview.getModule($li.data('moduleid')).remove();
}
$button.find('[data-rel=tooltip]').tooltip('destroy');
$button.confirmation('destroy');
$li.remove();
/**
* Sort Preview Modules - Sort the preview modules and sync there order
* related to the pages list. Used here to handle the `bg-primary` modules
* colors  and update the navigations menu related to the deleted pages.
*/
SortPreviewModules(true);
BuildToolJSON();
AutoSaveWizard(false,true);
} else {
$button.find('[data-rel=tooltip]').tooltip('destroy');
$button.confirmation('destroy');
$li.remove();
BuildToolJSON();
AutoSaveWizard(true,true);
}
/**
* When removing the E-commerce/Forum module we need to allow
* the user add it again by removing the class `module-limited-to-one` from
* the modules list in `addNewModuleIframe`
*/
if ( $.inArray($li.data('moduleid'),[112,123,125]) != -1 ) {
var $limitedModule = $('#addNewModuleIframe').contents().find('div[data-module-type-num="'+$li.data('moduleid')+'"]');
$limitedModule.removeClass('module-limited-to-one');
}
Wizard.refresh();
});
}
});
}
function ShowHideModulesDiv(element) {
if ($(element).is(":visible")) {
$(element).hide();
} else {
$(element).show();
}
}
/**
* The function return a modules settings according to the
* sent module tool id and the setting name.
*/
function GetModuleSetting(moduleID,setting) {
var returnResult = '';
var moduleTypeNUM = $('#card_'+moduleID+'').data('moduletypenum');
if ( !moduleTypeNUM && $.isNumeric(moduleID) ) moduleTypeNUM = moduleID;
if (modulesArr[Number(moduleTypeNUM)] && modulesArr[Number(moduleTypeNUM)]['module_kind']=='2') {
returnResult = modulesArr[Number(moduleTypeNUM)]['name'];
} else {
if ( tools_manage.length === 0 || !moduleID || !setting ) return;
modules = jQuery.parseJSON(tools_manage);
modules.forEach( function( module ) {
if ( module.moduleID == moduleID ) {
if ( typeof module[setting] === "object" ) {
returnResult = JSON.stringify(module[setting]);
} else {
returnResult = module[setting];
}
return;
}
});
}
return returnResult;
}
/**
* The function is responsible for editing the module setting
* @param {string} moduleID - the required module to edit.
* @param {string} setting - the key of the module setting.
* @param {string} value - the new value of the setting (E-commerce is sending object)
*/
function EditModuleSetting( moduleID, setting, value ) {
if ( tools_manage.length === 0 || !moduleID || !setting ) return;
var modules = tryParseJSON(tools_manage);
$.each(modules, function( index, module ) {
if ( module.moduleID == moduleID ) {
module[setting] = value;
return;
}
});
tools_manage = JSON.stringify(modules);
}
function uniqid(prefix, more_entropy) {
if (typeof prefix === 'undefined') {
prefix = '';
}
var retId;
var formatSeed = function(seed, reqWidth) {
seed = parseInt(seed, 10)
.toString(16); // to hex str
if (reqWidth < seed.length) { // so long we split
return seed.slice(seed.length - reqWidth);
}
if (reqWidth > seed.length) { // so short we pad
return Array(1 + (reqWidth - seed.length))
.join('0') + seed;
}
return seed;
};
if (!this.php_js) {
this.php_js = {};
}
if (!this.php_js.uniqidSeed) { // init seed with big random int
this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
}
this.php_js.uniqidSeed++;
retId = prefix; // start with prefix, add current milliseconds hex string
retId += formatSeed(parseInt(new Date()
.getTime() / 1000, 10), 8);
retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
if (more_entropy) {
retId += (Math.random() * 10)
.toFixed(8)
.toString();
}
return retId;
}
/**
* The function generate the module side menu.
*
* @param  {string}  moduleID - Module ID.
* @param  {integer} heighestHeightNUM - Highest Height.
* @param  {object}  sideMenu - Side menu properties.
* @param  {string}  activeTab - The tab that need to be marked as active.
* @return {string}  html - Return HTML of the module side menu.
*/
function BuildModuleSideMenu( moduleID, heighestHeightNUM, sideMenu, activeTab ) {
if ( sideMenu.length === 0 || sideMenu.tabs.length === 0 ) return;
tabs = sideMenu.tabs;
var websiteID = $('#id').val();
var html ='';
html = '<div id="moduleSideMenu" class="sidebar responsive-min" style="height:'+heighestHeightNUM+'px;" data-sidebar="true" data-sidebar-hover="true">';
html += '<ul class="nav nav-list fancy-scrollbar">';
var i = 1;
$.each( tabs, function( index, tab ) {
tab.divider = (typeof tab.divider !== 'undefined') ? tab.divider : '0';
tab.dash = (typeof tab.dash !== 'undefined') ? tab.dash : '0';
if (tab.dash=='1') {
return true;
}
/**
* Replacing statics variables with related
* variables to the same module
*/
tab.href = tab.href.replace('{{moduleID}}', moduleID);
tab.href = tab.href.replace('{{websiteID}}', websiteID);
tab.href = tab.href.replace('{{versionNUM}}', versionNUM);
if ( tab.subTabs ) {
$.each(tab.subTabs,function( index, subTab) {
if ( subTab.href.indexOf(activeTab) !== -1 ) tab._is_sub_tab_active = true;
});
}
if (tab.divider=='1') {
html += '<li class="dividerSubTitle">';
html += tab.title;
html += '</li>';
} else {
tab.active = (typeof tab.active == 'undefined') ? tab.href.indexOf(activeTab) !== -1 : tab.active;
if ( tab.active ) {
tab._li_class = 'active';
} else if ( tab._is_sub_tab_active ) {
tab._li_class = ' open active';
} else {
tab._li_class = '';
}
html += '<li class="'+tab._li_class+'">';
html += '<a href="#" class="dropdown-toggle" onclick="return false;" data-href="'+escapeHtml(tab.href)+'">';
html += '<i class="'+escapeHtml(tab.icon)+'"></i>';
html += '<span class="menu-text"> '+tab.title+' </span>';
html += '</a>';
html += '<b class="arrow"></b>';
if ( tab.subTabs ) {
html += '<ul class="submenu nav-hide" style="'+(tab._is_sub_tab_active ? 'display:block;' : 'display:none;' )+'">';
$.each(tab.subTabs,function( index, subTab) {
subTab.dash = (typeof subTab.dash !== 'undefined') ? subTab.dash : '0';
if ( subTab.dash == '1' ) return;
subTab.href = subTab.href.replace('{{moduleID}}', moduleID);
subTab.href = subTab.href.replace('{{websiteID}}', websiteID);
subTab.href = subTab.href.replace('{{versionNUM}}', versionNUM);
html += '<li' + (subTab.href.indexOf(activeTab) !== -1 ? ' class="active"' : '' ) + '>';
html += '<a href="#" onclick="return false;" data-href="'+escapeHtml(subTab.href)+'">';
html += '<i class="'+escapeHtml(subTab.icon)+'"></i>';
html += '<span class="menu-text"> '+subTab.title+' </span>'
html += '</a>';
html += '<b class="arrow"></b>';
html += '</li>';
});
html += '</ul>';
}
html += '</li>';
}
i++;
});
html += '</ul>';
html += '<div id="sidebar-preview-button">';
html += '<a href="/'+GetModuleSetting(moduleID,'url')+'?w='+websiteID+'&amp;disableCache='+getRandomInt(0,9999999)+'" target="_blank">'+translations.Preview+'</a>';
html += '</div>';
html += '</div>';
return html;
}
/**
* The function generate the module side menu for mobile devices.
*
* @param  {string}  moduleID - Module ID.
* @param  {integer} heighestHeightNUM - Highest Height.
* @param  {object}  sideMenu - Side menu properties.
* @param  {string}  activeTab - The tab that need to be marked as active.
* @return {string}  html - Return HTML of the module side menu.
*/
function BuildMobileModuleSideMenu( moduleID, heighestHeightNUM, sideMenu, activeTab ) {
if ( sideMenu.length === 0 || sideMenu.tabs.length === 0 ) return;
tabs = sideMenu.tabs;
var html ='';
html = '<div id="moduleMobileBottomMenu">';
var i = 1;
$.each( tabs, function( index, tab ) {
tab.divider = (typeof tab.divider !== 'undefined') ? tab.divider : '0';
tab.dash = (typeof tab.dash !== 'undefined') ? tab.dash : '0';
if (tab.dash=='1') {
return true;
}
if (tab.divider=='1') {
return true;
}
/**
* Replacing statics variables with related
* variables to the same module
*/
tab.href = tab.href.replace('{{moduleID}}', moduleID);
tab.href = tab.href.replace('{{websiteID}}', $('#id').val());
tab.href = tab.href.replace('{{versionNUM}}', versionNUM);
html += '<a href="#" class="' + (tab.href.indexOf(activeTab) !== -1 ? ' custom-active' : '' ) + ' text-center" onclick="return false;" data-href="'+escapeHtml(tab.href)+'">';
html += '<i class="'+escapeHtml(tab.icon)+' bigger-200"></i><span class="menu-text-container">'+tab.title+'</span>';
html += '</a>';
if ( tab.subTabs ) {
html += '<div class="sub-tabs">';
$.each(tab.subTabs,function( index, subTab) {
subTab.dash = (typeof subTab.dash !== 'undefined') ? subTab.dash : '0';
if ( subTab.dash == '1' ) return;
subTab.href = subTab.href.replace('{{moduleID}}', moduleID);
subTab.href = subTab.href.replace('{{websiteID}}', $('#id').val());
subTab.href = subTab.href.replace('{{versionNUM}}', versionNUM);
html += '<a href="#" class="' + (i==1 ? ' active' : '' ) + ' text-center" onclick="return false;" data-href="'+escapeHtml(subTab.href)+'">';
html += '<li class="'+escapeHtml(subTab.icon)+' bigger-200"></li><span class="menu-text-container">'+subTab.title+'</span>';
html += '</a>';
});
html += '</div>';
}
i++;
});
html += '</div>';
return html;
}
/**
* The function add a new external link module.
*/
function AddNewModuleExternalLink() {
if ( PagesLimitations() ) return;
if ( OpenPremiumFeatures(packageNUM) == '1' ) {
$('#upgradePackage').modal('show');
return;
}
moduleTypeNUM = 108;
AddNewModule(modulesArr[moduleTypeNUM]['parentModule'],modulesArr[moduleTypeNUM]['name'],false,modulesArr[moduleTypeNUM]['style'],modulesArr[moduleTypeNUM]['style'],1,1,0,1,0,'',moduleTypeNUM);
}
/**
* The function get list of modules that using client zone icon such Events, Pricing
* table, Donate, Simple store, Schedule booking, Forum or E-commerce pages.
*/
function GetModulesListUsingClientZoneIcon() {
return [2,10,15,37,96,112,123];
}/**
* Library.
*/
var Library = function() {
var L = {};
/**
* Library Initialize
*/
L.init = function( settings ) {
Translation.init(settings.translations);
L.$body = $('body');
L.$body.append(L.generateHTML());
L.$modal = L.$body.find('#imageLibrary');
L.events.init();
};
/**
* The function generate the Library HTML.
*
* @return {string} html - Library HTML.
*/
L.generateHTML = function() {
var html = '';
html += '<!-- imageLibrary Modal -->';
html += '<div class="modal s123-modal fade bs-example-modal-lg" id="imageLibrary" tabindex="-1" role="dialog" aria-labelledby="imageLibrary">';
html += '<div class="modal-dialog modal-lg" role="document">';
html += '<div class="modal-content">';
html += '<div class="modal-header">';
html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
html += '<h4 class="modal-title">' + L.translate.imageLibrary + '</h4>';
html += '</div>';
html += '<div class="modal-body"></div>';
html += '<div class="modal-footer">';
html += '<button type="button" class="btn btn-success" data-dismiss="modal">' + L.translate.close + '</button>';
html += '</div>';
html += '</div>';
html += '</div>';
html += '</div>';
return html;
};
/**
* The function initialize the Library events
*/
L.events = function() {
var E = {};
/**
* Initialize all the events.
*/
E.init = function() {
L.$modal.on('show.bs.modal', function ( event ) {
var liveUpdate = L.$modal.data('liveUpdate');
var minlibraryWidth = L.$modal.data('minlibraryWidth');
var reload = true;
/* if there is no upload file object at a page, that object is not exist and then
we get a JS error, we fix it by just creating the main object to be exist.
reproduce: Dashboard >> eCommerce >> Settings >> Configuration >> Terms >> Library */
if ( !topWindow.uploadFiles ) topWindow.uploadFiles = {};
var uploadFile = topWindow.uploadFiles[L.$modal.data('uploadFileInputId')];
if ( uploadFile ) {
if ( !uploadFile.imagesType ) uploadFile.imagesType = 'images';
if ( L.$modal.data('lastImagesType') ===  uploadFile.imagesType ) reload = false;
if ( !L.$modal.find('#flickrLibraryModal').hasClass('imageLibrary_live_'+liveUpdate) ) reload = true;
L.$modal.data('lastImagesType',uploadFile.imagesType);
} else {
L.$modal.data('lastImagesType',null);
}
var src = '/versions/'+versionNUM+'/wizard/imagesLibrary/pixabay.php?w='+websiteID+'&liveUpdate='+liveUpdate;
if ( minlibraryWidth == '1200' ) {
src += '&orientation=horizontal&min_width=1600&min_height=800';
}
if ( reload ) {
L.$modal.find('.modal-body').html('<iframe id="flickrLibraryModal" class="libraryIframe imageLibrary_live_'+liveUpdate+'" src="' + src + '" style="width:100%;height:500px;margin:0;padding:0;border:none;"></iframe>');
}
});
};
return E;
}();
/**
* The function is used to copy the values of all enumerable own
* properties from one or more source objects to a target object.
* It will return the target object.
*/
function objectAssign(target, sources) {
if ( Object.assign ) {
sources = Object.assign(target, sources);
} else {
for ( var prop in target ) if ( !sources.hasOwnProperty(prop) ) sources[prop] = target[prop];
}
return sources;
}
/**
* The function convert special characters to HTML entities, we use it when
* we add strings into HTML attributes, it used to prevent the breaks in
* the HTML e.g. title="abc"efg".
*
* Source: http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript
*/
function escapeHtml( text ) {
if ( !text ) return text;
var map = {
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
'"': '&quot;',
"'": '&#039;'
};
return text.toString().replace( /[&<>"']/g, function( m ) { return map[m]; } );
}
/**
* Translation Object - Handle the plugin translations variables.
*/
var Translation = {
def : {
imageLibrary: 'Image Library',
close: 'Close'
},
init : function( translations ) {
var t = translations ? objectAssign(this.def,translations) : this.def;
$.each(t, function( key, value ) {
t[key] = escapeHtml(value);
});
L.translate = t;
}
};
return L;
}();function _extends(){return(_extends=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(t[o]=n[o])}return t}).apply(this,arguments)}function _typeof(t){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}!function(t,e){"object"===("undefined"==typeof exports?"undefined":_typeof(exports))&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.LazyLoad=e()}(this,function(){"use strict";var t="undefined"!=typeof window,e=t&&!("onscroll"in window)||"undefined"!=typeof navigator&&/(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent),n=t&&"IntersectionObserver"in window,o=t&&"classList"in document.createElement("p"),r={elements_selector:"img",container:e||t?document:null,threshold:300,thresholds:null,data_src:"src",data_srcset:"srcset",data_sizes:"sizes",data_bg:"bg",class_loading:"loading",class_loaded:"loaded",class_error:"error",load_delay:0,auto_unobserve:!0,callback_enter:null,callback_exit:null,callback_reveal:null,callback_loaded:null,callback_error:null,callback_finish:null,use_native:!1},a=function(t,e){var n,o=new t(e);try{n=new CustomEvent("LazyLoad::Initialized",{detail:{instance:o}})}catch(t){(n=document.createEvent("CustomEvent")).initCustomEvent("LazyLoad::Initialized",!1,!1,{instance:o})}window.dispatchEvent(n)};var i=function(t,e){return t.getAttribute("data-"+e)},s=function(t,e,n){var o="data-"+e;null!==n?t.setAttribute(o,n):t.removeAttribute(o)},c=function(t){return"true"===i(t,"was-processed")},l=function(t,e){return s(t,"ll-timeout",e)},u=function(t){return i(t,"ll-timeout")},d=function(t,e){t&&t(e)},f=function(t,e){t._loadingCount+=e,0===t._elements.length&&0===t._loadingCount&&d(t._settings.callback_finish)},_=function(t){for(var e,n=[],o=0;e=t.children[o];o+=1)"SOURCE"===e.tagName&&n.push(e);return n},v=function(t,e,n){n&&t.setAttribute(e,n)},g=function(t,e){v(t,"sizes",i(t,e.data_sizes)),v(t,"srcset",i(t,e.data_srcset)),v(t,"src",i(t,e.data_src))},m={IMG:function(t,e){var n=t.parentNode;n&&"PICTURE"===n.tagName&&_(n).forEach(function(t){g(t,e)});g(t,e)},IFRAME:function(t,e){v(t,"src",i(t,e.data_src))},VIDEO:function(t,e){_(t).forEach(function(t){v(t,"src",i(t,e.data_src))}),v(t,"src",i(t,e.data_src)),t.load()}},b=function(t,e){var n,o,r=e._settings,a=t.tagName,s=m[a];if(s)return s(t,r),f(e,1),void(e._elements=(n=e._elements,o=t,n.filter(function(t){return t!==o})));!function(t,e){var n=i(t,e.data_src),o=i(t,e.data_bg);n&&(t.style.backgroundImage='url("'.concat(n,'")')),o&&(t.style.backgroundImage=o)}(t,r)},h=function(t,e){o?t.classList.add(e):t.className+=(t.className?" ":"")+e},p=function(t,e,n){t.addEventListener(e,n)},y=function(t,e,n){t.removeEventListener(e,n)},E=function(t,e,n){y(t,"load",e),y(t,"loadeddata",e),y(t,"error",n)},w=function(t,e,n){var r=n._settings,a=e?r.class_loaded:r.class_error,i=e?r.callback_loaded:r.callback_error,s=t.target;!function(t,e){o?t.classList.remove(e):t.className=t.className.replace(new RegExp("(^|\\s+)"+e+"(\\s+|$)")," ").replace(/^\s+/,"").replace(/\s+$/,"")}(s,r.class_loading),h(s,a),d(i,s),f(n,-1)},I=function(t,e){var n=function n(r){w(r,!0,e),E(t,n,o)},o=function o(r){w(r,!1,e),E(t,n,o)};!function(t,e,n){p(t,"load",e),p(t,"loadeddata",e),p(t,"error",n)}(t,n,o)},k=["IMG","IFRAME","VIDEO"],A=function(t,e){var n=e._observer;z(t,e),n&&e._settings.auto_unobserve&&n.unobserve(t)},L=function(t){var e=u(t);e&&(clearTimeout(e),l(t,null))},x=function(t,e){var n=e._settings.load_delay,o=u(t);o||(o=setTimeout(function(){A(t,e),L(t)},n),l(t,o))},z=function(t,e,n){var o=e._settings;!n&&c(t)||(k.indexOf(t.tagName)>-1&&(I(t,e),h(t,o.class_loading)),b(t,e),function(t){s(t,"was-processed","true")}(t),d(o.callback_reveal,t),d(o.callback_set,t))},O=function(t){return!!n&&(t._observer=new IntersectionObserver(function(e){e.forEach(function(e){return function(t){return t.isIntersecting||t.intersectionRatio>0}(e)?function(t,e){var n=e._settings;d(n.callback_enter,t),n.load_delay?x(t,e):A(t,e)}(e.target,t):function(t,e){var n=e._settings;d(n.callback_exit,t),n.load_delay&&L(t)}(e.target,t)})},{root:(e=t._settings).container===document?null:e.container,rootMargin:e.thresholds||e.threshold+"px"}),!0);var e},N=["IMG","IFRAME"],C=function(t,e){return function(t){return t.filter(function(t){return!c(t)})}((n=t||function(t){return t.container.querySelectorAll(t.elements_selector)}(e),Array.prototype.slice.call(n)));var n},M=function(t,e){this._settings=function(t){return _extends({},r,t)}(t),this._loadingCount=0,O(this),this.update(e)};return M.prototype={update:function(t){var n,o=this,r=this._settings;(this._elements=C(t,r),!e&&this._observer)?(function(t){return t.use_native&&"loading"in HTMLImageElement.prototype}(r)&&((n=this)._elements.forEach(function(t){-1!==N.indexOf(t.tagName)&&(t.setAttribute("loading","lazy"),z(t,n))}),this._elements=C(t,r)),this._elements.forEach(function(t){o._observer.observe(t)})):this.loadAll()},destroy:function(){var t=this;this._observer&&(this._elements.forEach(function(e){t._observer.unobserve(e)}),this._observer=null),this._elements=null,this._settings=null},load:function(t,e){z(t,this,e)},loadAll:function(){var t=this;this._elements.forEach(function(e){A(e,t)})}},t&&function(t,e){if(e)if(e.length)for(var n,o=0;n=e[o];o+=1)a(t,n);else a(t,e)}(M,window.lazyLoadOptions),M});
//# sourceMappingURL=lazyload.min.js.map
/**
* User action tracker Class
*/
Wizard.userActions = new function() {
var that = this;
/**
* Initialize user action tracker Class
*/
that.init = function( settings ) {
if ( !settings ) return;
that.userActions = settings.userActions;
addLogListner();
};
/**
* The method is updating the flags of the user actions
*/
that.logAction = function( filedName, flag ) {
if ( !that.userActions[filedName] ) return;
if ( flag == 'UndoRedoChange' ) filedName = 'flag_UseUndoRedo';
if ( flag == 'ReadyTemplateChange' ) return;
if ( isLogged(filedName) ) return;
that.userActions[filedName] = '1';
$.ajax({
type: "POST",
url: "/versions/"+versionNUM+"/wizard/userActions/updateUserAction.php",
data: {
w: $('#id').val(),
userActions: JSON.stringify(that.userActions)
},
success: function( response ) {
}
});
}
/**
* The function is adding log events to the elements
*/
function addLogListner() {
addWizardInputsLog();
addWizardTabsLog();
addWizardButtonsLog();
}
/**
* The function is adding log events to the wizard buttons
*/
function addWizardButtonsLog() {
$('#AddModuleWin').on('add_new_page', function( event, flag ) {
that.logAction('flag_AddedNewPage',flag);
});
$('.changePelleteColors').on('click.user_action',function( event, flag ) {
that.logAction('flag_OpenThemeTool',flag);
});
$('#previewScaleDevices').on('click.user_action', function( event, flag ) {
if ( flag === 'scale_init' ) return;
that.logAction('flag_UsePreview',flag);
});
}
/**
* The function is adding log events to the wizard inputs
*/
function addWizardInputsLog() {
$('#home_siteSlogan, #home_siteSlogan_2, #home_SecondSiteSlogan').on('change.user_action',function( event, flag ) {
that.logAction('flag_HomepageUpdateTitles',flag);
});
$('#font_slogan, #font_slogan_2, #font_second_slogan').on('change.user_action',function( event, flag ) {
that.logAction('flag_HomepageChangeFont',flag);
});
$('#name').on('change.user_action',function( event, flag ) {
that.logAction('flag_UpdateNameAndLogo',flag);
});
$('#home_slider_image_1, #home_slider_image_2, #home_slider_image_3, #home_slider_image_4, #home_slider_image_5, #home_start_image, #home_video_background').on('change.user_action',function( event, flag ) {
if ( typeof flag == 'object' ) {
that.logAction('flag_HomepageUploadImage',flag);
} else {
that.logAction('flag_HomepageChooseGalleryImage',flag);
}
});
}
/**
* The function is adding the log events to the wizard tabs when they are opened
*/
function addWizardTabsLog() {
Wizard.Tabs.home.t.on('open_wizard_tabs', function( event, flag ) {
that.logAction('flag_OpenHomepageTab',flag);
});
Wizard.Tabs.pages.t.on('open_wizard_tabs', function( event, flag ) {
that.logAction('flag_OpenPagesTab',flag);
});
Wizard.Tabs.design.t.on('open_wizard_tabs', function( event, flag ) {
that.logAction('flag_OpenDesignTab',flag);
});
Wizard.Tabs.settings.t.on('open_wizard_tabs', function( event, flag ) {
that.logAction('flag_OpenSettingsTab',flag);
});
Wizard.Tabs.domain.t.on('open_wizard_tabs', function( event, flag ) {
that.logAction('flag_OpenDomainTab',flag);
});
}
/**
* The function check if the sent tip is already ready and return true if so.
*/
function isLogged( filedName ) {
return that.userActions[filedName] == '1' ? true : false;
};
return that;
};