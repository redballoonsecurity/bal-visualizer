export default class VirtualList{
    constructor(config) {
        const itemHeight = this.itemHeight = config.itemHeight;

        this.items = config.items;
        this.generatorFn = config.generatorFn;
        this.totalRows = config.totalRows || (config.items && config.items.length);

        const scroller = VirtualList.createScroller(itemHeight * this.totalRows);
        this.container = VirtualList.createContainer();
        this.container.appendChild(scroller);

        // Cache 4 times the number of items that fit in the container viewport
        this.lastRepaintY = 0;
        this.lastScrolled = 0;
        this.screenItemsLen = Math.ceil(config.h / itemHeight);
        this.cachedItemsLen = this.screenItemsLen * 3;
        this.maxBuffer = this.screenItemsLen * itemHeight;

        this._renderChunk(this.container, 0);

        // As soon as scrolling has stopped, this interval asynchronouslyremoves all
        // the nodes that are not used anymore
        this.rmNodeInterval = setInterval(this._onClean.bind(this), 300);
        this.container.addEventListener('scroll', this._onScroll.bind(this));
    }

    static createContainer() {
        const c = document.createElement('div');
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.overflow = 'auto';
        c.style.position = 'relative';
        c.style.padding = 0;
        return c;
    };

    static createScroller(h) {
        const scroller = document.createElement('div');
        scroller.style.opacity = 0;
        scroller.style.position = 'absolute';
        scroller.style.top = 0;
        scroller.style.left = 0;
        scroller.style.width = '1px';
        scroller.style.height = h + 'px';
        return scroller;
    };

    _onClean() {
        if (Date.now() - this.lastScrolled <= 100) {
            return;
        }
        const badNodes = this.container.querySelectorAll('[data-rm="1"]');
        for (let i = 0, l = badNodes.length; i < l; i++) {
            this.container.removeChild(badNodes[i]);
        }
    }

    _onScroll(e=null) {
        const scrollTop = this.container.scrollTop; // Triggers reflow
        if (!this.lastRepaintY || Math.abs(scrollTop - this.lastRepaintY) > this.maxBuffer) {
            var first = parseInt(scrollTop / this.itemHeight) - this.screenItemsLen;
            this._renderChunk(this.container, first < 0 ? 0 : first);
            this.lastRepaintY = scrollTop;
        }

        this.lastScrolled = Date.now();
        if (e != null) {
            e.preventDefault && e.preventDefault();
        }
    }

    scrollTo(rowIndex, rowIndexEnd) {
        const height = this.container.offsetHeight;
        const currentPos = this.container.scrollTop;
        const rowStartPos = rowIndex * this.itemHeight;
        const rowEndPos = rowIndexEnd * this.itemHeight;
        if (
            (currentPos < rowStartPos && currentPos + height > rowStartPos) ||
            (currentPos < rowEndPos && currentPos + height > rowEndPos) ||
            (currentPos > rowEndPos && currentPos + height < rowEndPos)
        ) {
            return;
        }
        this.container.scrollTop = (rowEndPos <= currentPos) ?
            rowEndPos - this.itemHeight : rowStartPos - height + this.itemHeight;
        this._onScroll();
    }

    /**
     * Renders a particular, consecutive chunk of the total rows in the list. To
     * keep acceleration while scrolling, we mark the nodes that are candidate for
     * deletion instead of deleting them right away, which would suddenly stop the
     * acceleration. We delete them once scrolling has finished.
     *
     * @param {Node} node Parent node where we want to append the children chunk.
     * @param {Number} rowIndex Starting position, i.e. first children index.
     * @return {void}
     */
    _renderChunk(node, rowIndex) {
        let rowIndexEnd = rowIndex + this.cachedItemsLen;
        if (rowIndexEnd > this.totalRows) {
            rowIndexEnd = this.totalRows;
        }

        // Append all the new rows in a document fragment that we will later append to
        // the parent node
        const fragment = document.createDocumentFragment();
        this.generatorFn(rowIndex, rowIndexEnd)
            .map((item, childIndex) => {
                item.classList.add('vrow');
                item.style.position = 'absolute';
                item.style.top = ((rowIndex + childIndex) * this.itemHeight) + 'px';
                return item
            })
            .forEach(row => fragment.appendChild(row));

        // Hide and mark obsolete nodes for deletion.
        for (let j = 1, l = node.childNodes.length; j < l; j++) {
            node.childNodes[j].style.display = 'none';
            node.childNodes[j].setAttribute('data-rm', '1');
        }
        node.appendChild(fragment);
    };
}