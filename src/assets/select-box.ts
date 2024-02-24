/*
Copyright (C) Philippe Meyer 2019-2021
Distributed under the MIT License

https://github.com/PhilippeMarcMeyer/vanillaSelectBox
*/

const VSBoxCounter = (function () {
    let count = 0;
    let instances = [];
    return {
        set(instancePtr: VanillaSelectBox): number {
            instances.push({ offset: ++count, ptr: instancePtr });
            return instances[instances.length - 1].offset;
        },
        remove(instanceNr: number): void {
            const temp = instances.filter((x) => {
                return x.offset != instanceNr;
            });
            instances = temp.splice(0);
        },
        closeAllButMe(instanceNr: number): void {
            instances.forEach((x) => {
                if (x.offset != instanceNr) {
                    x.ptr.closeOrder();
                }
            });
        },
    };
})();

class VanillaSelectBox {
    instanceOffset: number;
    domSelector: string;
    root: HTMLSelectElement;
    rootToken: string;
    main: HTMLDivElement;
    button: HTMLDivElement | HTMLButtonElement;
    title: HTMLSpanElement;
    isMultiple: boolean;
    multipleSize: number;
    currentOptgroup: number;
    drop: HTMLDivElement;
    options: NodeListOf<HTMLOptionElement>;
    listElements: NodeListOf<Element>;
    isDisabled: boolean;
    ul: HTMLUListElement | undefined;
    ulmaxWidth: number;
    maxOptionWidth: number;
    maxSelect: number;
    onInitSize: number;
    forbidenAttributes: string[];
    forbidenClasses: string[];
    userOptions: {
        maxWidth: number;
        minWidth: number;
        maxHeight: number;
        translations: { all: string; item: string; items: string; selectAll: string; clearAll: string };
        placeHolder: string;
        stayOpen: boolean;
        disableSelectAll: boolean;
        buttonItemsSeparator: string;
    };
    keepInlineStyles: boolean;
    keepInlineCaretStyles: boolean;
    closeOrder: () => void;
    getCssArray: (selector: string) => string;
    init: () => void;
    getResult: () => string[];
    createTree: () => void;
    constructor(
        domSelector: string,
        options: {
            maxWidth?: number;
            minWidth?: number;
            maxHeight?: number;
            translations?: { all?: string; item?: string; items?: string; selectAll?: string; clearAll?: string };
            placeHolder?: string;
            stayOpen?: boolean;
            disableSelectAll?: boolean;
            itemsSeparator?: string;
            maxSelect?: number;
            maxOptionWidth?: number;
            keepInlineStyles?: boolean;
            keepInlineCaretStyles?: boolean;
        },
    ) {
        this.instanceOffset = VSBoxCounter.set(this);
        this.domSelector = domSelector;
        this.root = document.querySelector(domSelector);
        this.rootToken = null;
        this.main;
        this.button;
        this.title;
        this.isMultiple = this.root.hasAttribute("multiple");
        this.multipleSize = this.isMultiple && this.root.hasAttribute("size") ? parseInt(this.root.getAttribute("size")) : -1;
        this.currentOptgroup = 0;
        this.drop;
        this.options;
        this.listElements;
        this.isDisabled = false;
        this.ul = undefined;
        this.ulmaxWidth = 280;
        this.maxOptionWidth = Infinity;
        this.maxSelect = Infinity;
        this.onInitSize = -1;
        this.forbidenAttributes = ["class", "selected", "disabled", "data-text", "data-value"];
        this.forbidenClasses = ["active", "disabled"];
        this.userOptions = {
            maxWidth: 500,
            minWidth: -1,
            maxHeight: 400,
            translations: { all: "All", item: "item", items: "items", selectAll: "Select All", clearAll: "Clear All" },
            placeHolder: "",
            stayOpen: false,
            disableSelectAll: false,
            buttonItemsSeparator: ",",
        };
        this.keepInlineStyles = true;
        this.keepInlineCaretStyles = true;
        if (options) {
            if (options.itemsSeparator != undefined) {
                this.userOptions.buttonItemsSeparator = options.itemsSeparator;
            }
            if (options.maxWidth != undefined) {
                this.userOptions.maxWidth = options.maxWidth;
            }
            if (options.minWidth != undefined) {
                this.userOptions.minWidth = options.minWidth;
            }
            if (options.maxHeight != undefined) {
                this.userOptions.maxHeight = options.maxHeight;
            }
            if (options.translations != undefined) {
                for (const property in options.translations) {
                    if (Object.prototype.hasOwnProperty.call(options.translations, property)) {
                        if (this.userOptions.translations[property]) {
                            this.userOptions.translations[property] = options.translations[property];
                        }
                    }
                }
            }
            if (options.placeHolder != undefined) {
                this.userOptions.placeHolder = options.placeHolder;
            }

            if (options.stayOpen != undefined) {
                this.userOptions.stayOpen = options.stayOpen;
            }

            if (options.disableSelectAll != undefined) {
                this.userOptions.disableSelectAll = options.disableSelectAll;
            }

            if (options.maxSelect != undefined && !isNaN(options.maxSelect) && options.maxSelect >= 1) {
                this.maxSelect = options.maxSelect;
                this.userOptions.disableSelectAll = true;
            }

            if (options.maxOptionWidth != undefined && !isNaN(options.maxOptionWidth) && options.maxOptionWidth >= 20) {
                this.maxOptionWidth = options.maxOptionWidth;
                this.ulmaxWidth = options.maxOptionWidth + 60;
            }

            if (options.keepInlineStyles != undefined) {
                this.keepInlineStyles = options.keepInlineStyles;
            }
            if (options.keepInlineCaretStyles != undefined) {
                this.keepInlineCaretStyles = options.keepInlineCaretStyles;
            }
        }

        this.closeOrder = function () {
            if (!this.userOptions.stayOpen) {
                this.drop.style.visibility = "hidden";
            }
        };

        this.getCssArray = function (selector) {
            // Why inline css ? To protect the button display from foreign css files
            let cssArray = [];
            if (selector === ".vsb-main button") {
                cssArray = [
                    { key: "min-width", value: "120px" },
                    { key: "border-radius", value: "0" },
                    { key: "width", value: "100%" },
                    { key: "text-align", value: "left" },
                    { key: "z-index", value: "1" },
                    { key: "color", value: "#333" },
                    { key: "background", value: "white !important" },
                    { key: "border", value: "1px solid #999 !important" },
                    { key: "line-height", value: "20px" },
                    { key: "font-size", value: "14px" },
                    { key: "padding", value: "6px 12px" },
                ];
            }

            return cssArrayToString(cssArray);

            function cssArrayToString(cssList) {
                let list = "";
                cssList.forEach((x) => {
                    list += x.key + ":" + x.value + ";";
                });
                return list;
            }
        };

        this.init = function () {
            this.createTree();
        };

        this.getResult = function () {
            const result = [];
            const collection = this.root.querySelectorAll("option");
            collection.forEach((x) => {
                if (x.selected) {
                    result.push(x.value);
                }
            });
            return result;
        };

        this.createTree = () => {
            this.rootToken = this.domSelector.replace(/[^A-Za-z0-9]+/, "");
            this.root.style.display = "none";
            const already = document.getElementById("btn-group-" + this.rootToken);
            if (already) {
                already.remove();
            }
            this.main = document.createElement("div");
            this.root.parentNode.insertBefore(this.main, this.root.nextSibling);
            this.main.classList.add("vsb-main");
            this.main.setAttribute("id", "btn-group-" + this.rootToken);
            if (this.userOptions.stayOpen) {
                this.main.style.minHeight = this.userOptions.maxHeight + 10 + "px";
            }

            if (this.userOptions.stayOpen) {
                this.button = document.createElement("div");
            } else {
                this.button = document.createElement("button");
                if (this.keepInlineStyles) {
                    const cssList = this.getCssArray(".vsb-main button");
                    this.button.setAttribute("style", cssList);
                }
            }
            this.button.style.maxWidth = this.userOptions.maxWidth + "px";
            if (this.userOptions.minWidth !== -1) {
                this.button.style.minWidth = this.userOptions.minWidth + "px";
            }

            this.main.appendChild(this.button);
            this.title = document.createElement("span");
            this.button.appendChild(this.title);
            this.title.classList.add("title");
            const caret = document.createElement("span");
            this.button.appendChild(caret);

            caret.classList.add("caret");
            if (this.keepInlineCaretStyles) {
                caret.style.position = "absolute";
                caret.style.right = "8px";
                caret.style.marginTop = "8px";
            }

            if (this.userOptions.stayOpen) {
                caret.style.display = "none";
                this.title.style.paddingLeft = "20px";
                this.title.style.fontStyle = "italic";
                this.title.style.verticalAlign = "20%";
            }

            this.drop = document.createElement("div");
            this.main.appendChild(this.drop);
            this.drop.classList.add("vsb-menu");
            this.drop.style.zIndex = String(2000 - this.instanceOffset);
            this.ul = document.createElement("ul");
            this.drop.appendChild(this.ul);

            this.ul.style.maxHeight = this.userOptions.maxHeight + "px";
            this.ul.style.maxWidth = this.ulmaxWidth + "px";
            if (this.isMultiple) {
                this.ul.classList.add("multi");
                if (!this.userOptions.disableSelectAll) {
                    const selectAll = document.createElement("option");
                    selectAll.setAttribute("value", "all");
                    selectAll.innerText = this.userOptions.translations.selectAll;
                    this.root.insertBefore(selectAll, this.root.hasChildNodes() ? this.root.childNodes[0] : null);
                }
            }
            let selectedTexts = "";
            let sep = "";
            let nrActives = 0;

            this.options = document.querySelectorAll(this.domSelector + " > option");
            Array.from(this.options).forEach((x: HTMLOptionElement) => {
                const text = x.textContent;
                const value = x.value;
                let originalAttrs;
                if (x.hasAttributes()) {
                    originalAttrs = Array.from(x.attributes).filter((a) => {
                        return this.forbidenAttributes.indexOf(a.name) === -1;
                    });
                }
                let classes: string | string[] = x.getAttribute("class");
                if (classes) {
                    classes = classes.split(" ").filter((c) => {
                        return this.forbidenClasses.indexOf(c) === -1;
                    });
                } else {
                    classes = [];
                }
                const li = document.createElement("li");
                const isSelected = x.hasAttribute("selected");
                const isDisabled = x.hasAttribute("disabled");

                this.ul.appendChild(li);
                li.setAttribute("data-value", value);
                li.setAttribute("data-text", text);

                if (originalAttrs !== undefined) {
                    originalAttrs.forEach((a) => {
                        li.setAttribute(a.name, a.value);
                    });
                }

                classes.forEach((x) => {
                    li.classList.add(x);
                });

                if (this.maxOptionWidth < Infinity) {
                    li.classList.add("short");
                    li.style.maxWidth = this.maxOptionWidth + "px";
                }

                if (isSelected) {
                    nrActives++;
                    selectedTexts += sep + text;
                    sep = this.userOptions.buttonItemsSeparator;
                    li.classList.add("active");
                    if (!this.isMultiple) {
                        this.title.textContent = text;
                        if (classes.length != 0) {
                            classes.forEach((x) => {
                                this.title.classList.add(x);
                            });
                        }
                    }
                }
                if (isDisabled) {
                    li.classList.add("disabled");
                }
                li.appendChild(document.createTextNode(" " + text));
            });

            const optionsLength = this.options.length - Number(!this.userOptions.disableSelectAll);

            if (optionsLength == nrActives) {
                // Bastoune idea to preserve the placeholder
                const wordForAll = this.userOptions.translations.all;
                selectedTexts = wordForAll;
            } else if (this.multipleSize != -1) {
                if (nrActives > this.multipleSize) {
                    const wordForItems = nrActives === 1 ? this.userOptions.translations.item : this.userOptions.translations.items;
                    selectedTexts = nrActives + " " + wordForItems;
                }
            }
            if (this.isMultiple) {
                this.title.innerHTML = selectedTexts;
            }
            if (this.userOptions.placeHolder != "" && this.title.textContent == "") {
                this.title.textContent = this.userOptions.placeHolder;
            }
            this.listElements = this.drop.querySelectorAll("li:not(.grouped-option)");

            if (this.userOptions.stayOpen) {
                this.drop.style.visibility = "visible";
                this.drop.style.boxShadow = "none";
                this.drop.style.minHeight = this.userOptions.maxHeight + 10 + "px";
                this.drop.style.position = "relative";
                this.drop.style.left = "0px";
                this.drop.style.top = "0px";
                this.button.style.border = "none";
            } else {
                this.main.addEventListener("click", (e) => {
                    if (this.isDisabled) return;
                    this.drop.style.visibility = "visible";
                    document.addEventListener("click", docListener);
                    e.preventDefault();
                    e.stopPropagation();
                    if (!this.userOptions.stayOpen) {
                        VSBoxCounter.closeAllButMe(this.instanceOffset);
                    }
                });
            }

            this.drop.addEventListener("click", (e) => {
                if (this.isDisabled) return;
                const target = e.target as HTMLElement;

                if (target.tagName === "INPUT") return;
                const isShowHideCommand = target.tagName === "SPAN";
                const isCheckCommand = target.tagName === "I";
                const liClicked = target.parentElement;
                if (!liClicked.hasAttribute("data-value")) {
                    if (liClicked.classList.contains("grouped-option")) {
                        if (!isShowHideCommand && !isCheckCommand) return;
                        let oldClass, newClass;
                        if (isCheckCommand) {
                            // check or uncheck children
                            this.checkUncheckFromParent(liClicked);
                        } else {
                            //open or close
                            if (liClicked.classList.contains("open")) {
                                oldClass = "open";
                                newClass = "closed";
                            } else {
                                oldClass = "closed";
                                newClass = "open";
                            }
                            liClicked.classList.remove(oldClass);
                            liClicked.classList.add(newClass);
                            const theChildren = this.drop.querySelectorAll("[data-parent='" + liClicked.id + "']");
                            theChildren.forEach((x) => {
                                x.classList.remove(oldClass);
                                x.classList.add(newClass);
                            });
                        }
                        return;
                    }
                }
                const choiceValue = target.getAttribute("data-value");
                const choiceText = target.getAttribute("data-text");
                const className = target.getAttribute("class");

                if (className && className.indexOf("disabled") != -1) {
                    return;
                }

                if (className && className.indexOf("overflow") != -1) {
                    return;
                }

                if (choiceValue === "all") {
                    if (target.hasAttribute("data-selected") && target.getAttribute("data-selected") === "true") {
                        this.setValue("none");
                    } else {
                        this.setValue("all");
                    }
                    return;
                }

                if (!this.isMultiple) {
                    this.root.value = choiceValue;
                    this.title.textContent = choiceText;
                    if (className) {
                        this.title.setAttribute("class", className + " title");
                    } else {
                        this.title.setAttribute("class", "title");
                    }
                    Array.from(this.listElements).forEach((x) => {
                        x.classList.remove("active");
                    });
                    if (choiceText != "") {
                        target.classList.add("active");
                    }
                    this.privateSendChange();
                    if (!this.userOptions.stayOpen) {
                        docListener();
                    }
                } else {
                    let wasActive = false;
                    if (className) {
                        wasActive = className.indexOf("active") != -1;
                    }
                    if (wasActive) {
                        target.classList.remove("active");
                    } else {
                        target.classList.add("active");
                    }
                    if (target.hasAttribute("data-parent")) {
                        this.checkUncheckFromChild(target);
                    }

                    let selectedTexts = "";
                    let sep = "";
                    let nrActives = 0;
                    let nrAll = 0;
                    for (let i = 0; i < this.options.length; i++) {
                        nrAll++;
                        if (this.options[i].value == choiceValue) {
                            this.options[i].selected = !wasActive;
                        }
                        if (this.options[i].selected) {
                            nrActives++;
                            selectedTexts += sep + this.options[i].textContent;
                            sep = this.userOptions.buttonItemsSeparator;
                        }
                    }
                    if (nrAll == nrActives - Number(!this.userOptions.disableSelectAll)) {
                        const wordForAll = this.userOptions.translations.all;
                        selectedTexts = wordForAll;
                    } else if (this.multipleSize != -1) {
                        if (nrActives > this.multipleSize) {
                            const wordForItems = nrActives === 1 ? this.userOptions.translations.item : this.userOptions.translations.items;
                            selectedTexts = nrActives + " " + wordForItems;
                        }
                    }
                    this.title.textContent = selectedTexts;
                    this.checkSelectMax(nrActives);
                    this.checkUncheckAll();
                    this.privateSendChange();
                }
                e.preventDefault();
                e.stopPropagation();
                if (this.userOptions.placeHolder != "" && this.title.textContent == "") {
                    this.title.textContent = this.userOptions.placeHolder;
                }
            });
            const docListener = () => {
                document.removeEventListener("click", docListener);
                this.drop.style.visibility = "hidden";
            };
        };
        this.init();
        this.checkUncheckAll();
    }
    disableItems(values) {
        const foundValues = [];
        if (vanillaSelectBox_type(values) == "string") {
            values = values.split(",");
        }

        if (vanillaSelectBox_type(values) == "array") {
            Array.from(this.options).forEach((x) => {
                if (values.indexOf(x.value) != -1) {
                    foundValues.push(x.value);
                    x.setAttribute("disabled", "");
                }
            });
        }
        Array.from(this.listElements).forEach((x) => {
            const val = x.getAttribute("data-value");
            if (foundValues.indexOf(val) != -1) {
                x.classList.add("disabled");
            }
        });
    }
    checkSelectMax(nrActives: number) {
        if (this.maxSelect == Infinity || !this.isMultiple) return;
        if (this.maxSelect <= nrActives) {
            Array.from(this.listElements).forEach((x) => {
                if (x.hasAttribute("data-value")) {
                    if (!x.classList.contains("disabled") && !x.classList.contains("active")) {
                        x.classList.add("overflow");
                    }
                }
            });
        } else {
            Array.from(this.listElements).forEach((x) => {
                if (x.classList.contains("overflow")) {
                    x.classList.remove("overflow");
                }
            });
        }
    }
    checkUncheckFromChild(liClicked: HTMLElement) {
        const parentId = liClicked.getAttribute("data-parent");
        const parentLi = document.getElementById(parentId);
        if (!this.isMultiple) return;
        const listElements = this.drop.querySelectorAll("li");
        const childrenElements = Array.from(listElements).filter(function (el) {
            return el.hasAttribute("data-parent") && el.getAttribute("data-parent") == parentId && !el.classList.contains("hidden-search");
        });
        let nrChecked = 0;
        const nrCheckable = childrenElements.length;
        if (nrCheckable == 0) return;
        childrenElements.forEach(function (el) {
            if (el.classList.contains("active")) nrChecked++;
        });
        if (nrChecked === nrCheckable || nrChecked === 0) {
            if (nrChecked === 0) {
                parentLi.classList.remove("checked");
            } else {
                parentLi.classList.add("checked");
            }
        } else {
            parentLi.classList.remove("checked");
        }
    }
    checkUncheckFromParent(liClicked: HTMLElement) {
        const parentId = liClicked.id;
        if (!this.isMultiple) return;
        const listElements = this.drop.querySelectorAll("li");
        const childrenElements = Array.from(listElements).filter(function (el) {
            return el.hasAttribute("data-parent") && el.getAttribute("data-parent") == parentId && !el.classList.contains("hidden-search");
        });
        let nrChecked = 0;
        const nrCheckable = childrenElements.length;
        if (nrCheckable == 0) return;
        childrenElements.forEach(function (el) {
            if (el.classList.contains("active")) nrChecked++;
        });
        if (nrChecked === nrCheckable || nrChecked === 0) {
            //check all or uncheckAll : just do the opposite
            childrenElements.forEach(function (el) {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("click", true, false);
                el.dispatchEvent(event);
            });
            if (nrChecked === 0) {
                liClicked.classList.add("checked");
            } else {
                liClicked.classList.remove("checked");
            }
        } else {
            //check all
            liClicked.classList.remove("checked");
            childrenElements.forEach(function (el) {
                if (!el.classList.contains("active")) {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("click", true, false);
                    el.dispatchEvent(event);
                }
            });
        }
    }
    checkUncheckAll() {
        if (!this.isMultiple) return;
        let nrChecked = 0;
        let nrCheckable = 0;
        let totalAvailableElements = 0;
        let checkAllElement = null;
        if (this.listElements == null) return;
        Array.from(this.listElements).forEach((x) => {
            if (x.hasAttribute("data-value")) {
                if (x.getAttribute("data-value") === "all") {
                    checkAllElement = x;
                }
                if (x.getAttribute("data-value") !== "all" && !x.classList.contains("hidden-search") && !x.classList.contains("disabled")) {
                    nrCheckable++;
                    nrChecked += x.classList.contains("active") ? 1 : 0;
                }
                if (x.getAttribute("data-value") !== "all" && !x.classList.contains("disabled")) {
                    totalAvailableElements++;
                }
            }
        });

        if (checkAllElement) {
            if (nrChecked === nrCheckable) {
                // check the checkAll checkbox
                if (nrChecked === totalAvailableElements) {
                    this.title.textContent = this.userOptions.translations.all;
                }
                checkAllElement.classList.add("active");
                checkAllElement.innerText = this.userOptions.translations.clearAll;
                checkAllElement.setAttribute("data-selected", "true");
            } else if (nrChecked === 0) {
                // uncheck the checkAll checkbox
                this.title.textContent = this.userOptions.placeHolder;
                checkAllElement.classList.remove("active");
                checkAllElement.innerText = this.userOptions.translations.selectAll;
                checkAllElement.setAttribute("data-selected", "false");
            }
        }
    }
    setValue(values) {
        const listElements = this.drop.querySelectorAll("li");

        if (values == null || values == undefined || values == "") {
            this.empty();
        } else {
            if (this.isMultiple) {
                if (vanillaSelectBox_type(values) == "string") {
                    if (values === "all") {
                        values = [];
                        Array.from(listElements).forEach((x) => {
                            if (x.hasAttribute("data-value")) {
                                const value = x.getAttribute("data-value");
                                if (value !== "all") {
                                    if (!x.classList.contains("hidden-search") && !x.classList.contains("disabled")) {
                                        values.push(x.getAttribute("data-value"));
                                    }
                                    // already checked (but hidden by search)
                                    if (x.classList.contains("active")) {
                                        if (x.classList.contains("hidden-search") || x.classList.contains("disabled")) {
                                            values.push(value);
                                        }
                                    }
                                } else {
                                    x.classList.add("active");
                                }
                            } else if (x.classList.contains("grouped-option")) {
                                x.classList.add("checked");
                            }
                        });
                    } else if (values === "none") {
                        values = [];
                        Array.from(listElements).forEach((x) => {
                            if (x.hasAttribute("data-value")) {
                                const value = x.getAttribute("data-value");
                                if (value !== "all") {
                                    if (x.classList.contains("active")) {
                                        if (x.classList.contains("hidden-search") || x.classList.contains("disabled")) {
                                            values.push(value);
                                        }
                                    }
                                }
                            } else if (x.classList.contains("grouped-option")) {
                                x.classList.remove("checked");
                            }
                        });
                    } else {
                        values = values.split(",");
                    }
                }
                const foundValues = [];
                if (vanillaSelectBox_type(values) == "array") {
                    Array.from(this.options).forEach((x) => {
                        if (values.indexOf(x.value) !== -1) {
                            x.selected = true;
                            foundValues.push(x.value);
                        } else {
                            x.selected = false;
                        }
                    });
                    let selectedTexts = "";
                    let sep = "";
                    let nrActives = 0;
                    let nrAll = 0;
                    Array.from(listElements).forEach((x) => {
                        const value = x.getAttribute("data-value");
                        if (value !== "all") {
                            nrAll++;
                        }
                        if (foundValues.indexOf(x.getAttribute("data-value")) != -1) {
                            x.classList.add("active");
                            nrActives++;
                            selectedTexts += sep + x.getAttribute("data-text");
                            sep = this.userOptions.buttonItemsSeparator;
                        } else {
                            x.classList.remove("active");
                        }
                    });
                    if (nrAll == nrActives - Number(!this.userOptions.disableSelectAll)) {
                        const wordForAll = this.userOptions.translations.all;
                        selectedTexts = wordForAll;
                    } else if (this.multipleSize != -1) {
                        if (nrActives > this.multipleSize) {
                            const wordForItems = nrActives === 1 ? this.userOptions.translations.item : this.userOptions.translations.items;
                            selectedTexts = nrActives + " " + wordForItems;
                        }
                    }
                    this.title.textContent = selectedTexts;
                    this.privateSendChange();
                }
                this.checkUncheckAll();
            } else {
                let found = false;
                let text = "";
                let className = "";
                Array.from(listElements).forEach((x) => {
                    const liVal = x.getAttribute("data-value");
                    if (liVal == values) {
                        x.classList.add("active");
                        found = true;
                        text = x.getAttribute("data-text");
                    } else {
                        x.classList.remove("active");
                    }
                });
                Array.from(this.options).forEach((x) => {
                    if (x.value == values) {
                        x.selected = true;
                        className = x.getAttribute("class");
                        if (!className) className = "";
                    } else {
                        x.selected = false;
                    }
                });
                if (found) {
                    this.title.textContent = text;
                    if (this.userOptions.placeHolder != "" && this.title.textContent == "") {
                        this.title.textContent = this.userOptions.placeHolder;
                    }
                    if (className != "") {
                        this.title.setAttribute("class", className + " title");
                    } else {
                        this.title.setAttribute("class", "title");
                    }
                }
            }
        }
    }
    privateSendChange() {
        const event = document.createEvent("HTMLEvents");
        event.initEvent("change", true, false);
        this.root.dispatchEvent(event);
    }
    empty() {
        Array.from(this.listElements).forEach((x) => {
            x.classList.remove("active");
        });
        const parentElements = this.drop.querySelectorAll("li.grouped-option");
        if (parentElements) {
            Array.from(parentElements).forEach((x) => {
                x.classList.remove("checked");
            });
        }
        Array.from(this.options).forEach((x) => {
            x.selected = false;
        });
        this.title.textContent = "";
        if (this.userOptions.placeHolder != "" && this.title.textContent == "") {
            this.title.textContent = this.userOptions.placeHolder;
        }
        this.checkUncheckAll();
        this.privateSendChange();
    }
    destroy() {
        const already = document.getElementById("btn-group-" + this.rootToken);
        if (already) {
            VSBoxCounter.remove(this.instanceOffset);
            already.remove();
            this.root.style.display = "inline-block";
        }
    }
    disable() {
        this.main.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        const already = document.getElementById("btn-group-" + this.rootToken);
        if (already) {
            const button = already.querySelector("button");
            if (button) button.classList.add("disabled");
            this.isDisabled = true;
        }
    }
    enable() {
        const already = document.getElementById("btn-group-" + this.rootToken);
        if (already) {
            const button = already.querySelector("button");
            if (button) button.classList.remove("disabled");
            this.isDisabled = false;
        }
    }
}

function vanillaSelectBox_type(target: object | string | object[] | string[]) {
    const computedType = Object.prototype.toString.call(target);
    const stripped = computedType.replace("[object ", "").replace("]", "");
    const lowercased = stripped.toLowerCase();
    return lowercased;
}

export { VanillaSelectBox };
