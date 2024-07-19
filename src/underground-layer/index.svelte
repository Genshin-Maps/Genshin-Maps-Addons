<script lang="ts">
  import { isUndergroundMapActive } from "@addons/stores";
  import { onDestroy } from "svelte";
  import { unsafeWindow } from "$";
  import { repository } from "@/package.json";
  import { isTouchScreen } from "@addons/utils";
  import gmFetch from "@sec-ant/gm-fetch";

  let selectionsPos = {};
  loadSelectionPos();
  let undergroundLayer: HTMLElement;
  let undergroundImageLayer: HTMLElement;
  $: unsafeWindow.MAPS_Type = unsafeWindow.MAPS_Type || 'teyvat';
  $: unsafeWindow.MAPS_RelativeX = unsafeWindow.MAPS_RelativeX || 0;
  $: unsafeWindow.MAPS_RelativeY = unsafeWindow.MAPS_RelativeY || 0;
  let selectionG, selectionI;

  let active = false;
  let layerScale = unsafeWindow.MAPS_ViewSize / unsafeWindow.MAPS_Size;

  async function parseUndergroundGroups() {
    const res = await gmFetch(`${repository.url}/raw/gh-pages/dist/underground_layers.json`);
    let imageGroups = await res.json();
    return imageGroups;
  }

  async function fetchUndergroundFloorImage(floor) {
    const base64Response = await gmFetch(floor.image_url);
    const blob = await base64Response.blob();
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  }

  function portal(node, { target }) {
    if (target instanceof HTMLElement) {
        target.appendChild(node);
    }
  }
  function getImageX(x: number, mapCode: string) {
    const relativeX = unsafeWindow.MAPS_Version[mapCode].relativeX || unsafeWindow.MAPS_RelativeX;
    return x + relativeX;
  }
  function getImageY(y: number, mapCode: string) {
    const relativeY = unsafeWindow.MAPS_Version[mapCode].relativeY || unsafeWindow.MAPS_RelativeY;
    return y + relativeY;
  }
  function getSelectionPos(groupId: number) {
    return selectionsPos[groupId] || undefined;
  }
  function saveSelectionPos(groupId: number, x, y) {
    selectionsPos[groupId] = [x, y];
    localStorage.setItem(
      "addon-underground-select-positions",
      JSON.stringify(selectionsPos)
    );
  }
  function loadSelectionPos() {
    let storageString = localStorage.getItem(
      "addon-underground-select-positions"
    );
    if (storageString) selectionsPos = JSON.parse(storageString);
  }
  function addDragEvent(node) {
    if (isTouchScreen) {
      node.addEventListener("touchstart", onTouchDown);
    } else {
      node.addEventListener("mousedown", onMouseDown);
    }
  }
  function moveAt(
    t: HTMLElement,
    pageX: number,
    pageY: number,
    offset: [number, number]
  ) {
    if (t instanceof HTMLElement) {
      pageX = Math.round(
        ((pageX + unsafeWindow.objectViewer.scrollLeft) /
          unsafeWindow.MAPS_Scale) *
          100
      );
      pageY = Math.round(
        ((pageY + unsafeWindow.objectViewer.scrollTop) /
          unsafeWindow.MAPS_Scale) *
          100
      );

      t.style.left = `${pageX + offset[0]}px`;
      t.style.top = `${pageY + offset[1]}px`;
    }
  }
  function onTouchDown(event: TouchEvent) {
    event.stopPropagation();

    let t;
    let offset: [number, number] = [0, 0];
    if (event.target instanceof HTMLElement) {
      t = event.currentTarget;
    }

    offset = [
      t.offsetLeft -
        Math.round(
          ((event.touches[0].pageX + unsafeWindow.objectViewer.scrollLeft) /
            unsafeWindow.MAPS_Scale) *
            100
        ),
      t.offsetTop -
        Math.round(
          ((event.touches[0].pageY + unsafeWindow.objectViewer.scrollTop) /
            unsafeWindow.MAPS_Scale) *
            100
        ),
    ];

    if (t instanceof HTMLElement) {
      function onTouchMove(event) {
        moveAt(t, event.touches[0].pageX, event.touches[0].pageY, offset);
      }

      function releaseDrag() {
        document.removeEventListener("touchmove", onTouchMove);
        saveSelectionPos(t.dataset.group, t.offsetLeft, t.offsetTop);
      }

      document.addEventListener("touchmove", onTouchMove);
      window.addEventListener("focus", releaseDrag, { once: true });
      t.addEventListener("touchend", releaseDrag, { once: true });
    }
  }
  function onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    let t;
    let offset: [number, number] = [0, 0];
    if (
      event.currentTarget instanceof HTMLElement &&
      event.target instanceof HTMLElement
    ) {
      if (!event.target.classList.contains("underground-selection-head"))
        return;
      t = event.currentTarget;
    }

    offset = [
      t.offsetLeft -
        Math.round(
          ((event.pageX + unsafeWindow.objectViewer.scrollLeft) /
            unsafeWindow.MAPS_Scale) *
            100
        ),
      t.offsetTop -
        Math.round(
          ((event.pageY + unsafeWindow.objectViewer.scrollTop) /
            unsafeWindow.MAPS_Scale) *
            100
        ),
    ];

    if (t instanceof HTMLElement) {
      function onMouseMove(event) {
        moveAt(t, event.pageX, event.pageY, offset);
      }

      function releaseDrag() {
        document.removeEventListener("mousemove", onMouseMove);
        saveSelectionPos(t.dataset.group, t.offsetLeft, t.offsetTop);
      }

      document.addEventListener("mousemove", onMouseMove);
      window.addEventListener("focus", releaseDrag, { once: true });
      t.addEventListener("mouseup", releaseDrag, { once: true });
    }
  }
  function onClickSelection(groupId: number, index: number) {
    if (selectionG != groupId || selectionI != index) {
      selectionG = groupId;
      selectionI = index;
      unsafeWindow.objectLayerBase.classList.add("grayscale");
    } else {
      selectionG = undefined;
      selectionI = undefined;
      unsafeWindow.objectLayerBase.classList.remove("grayscale");
    }
  }
  const unsubscribe = isUndergroundMapActive.subscribe((value) => {
    active = value;
    if(active) {
        if (selectionG != groupId || selectionI != index) {
            selectionG = groupId;
            selectionI = index;
            unsafeWindow.objectLayerBase.classList.add("grayscale");
        }
    } else {
        unsafeWindow.objectLayerBase.classList.remove("grayscale");
    }
  });
  export const redraw = () => {
    if (!active) return;
    unsafeWindow.MAPS_RelativeX = unsafeWindow.MAPS_RelativeX;
    unsafeWindow.MAPS_RelativeY = unsafeWindow.MAPS_RelativeY;
    unsafeWindow.MAPS_Type = unsafeWindow.MAPS_Type;
    layerScale = unsafeWindow.MAPS_ViewSize / unsafeWindow.MAPS_Size;
  };
  onDestroy(unsubscribe);
</script>

<template>
    <div
      id="mapsLayerUnderground"
      role="tree"
      use:portal={{ target: document.getElementById("mapsLayerPoint") }}
      bind:this={undergroundLayer}
      class="underground-layer {!selectionG && !selectionI ? '' : 'selected'}"
      class:active
    >
      <div id="mapsLayerUndergroundImage"
        bind:this={undergroundImageLayer}
        class="underground-image-layer"
        >
      </div>
      {#await parseUndergroundGroups() then imageGroups}
        {#each imageGroups as group, i (group)}
            {#if group.mapCode == unsafeWindow.MAPS_Type}
                <div
                role="treeitem"
                
                aria-selected={selectionG === group.id}
                class="underground-selection"
                tabindex={i}
                data-group={group.id}
                use:addDragEvent
                style="left:{getSelectionPos(group.id)?.[0] ||
                    getImageX(group.centerX, group.mapCode)}px; top:{getSelectionPos(group.id)?.[1] ||
                    getImageY(group.centerY, group.mapCode)}px;"
                on:dragstart={() => {
                    return false;
                }}
                >
                    <div class="underground-selection-head">
                        {group.name ? group.name : ""}
                    </div>
                    <div
                        role="tablist"
                        class="underground-selection-body"
                    >
                        {#each group.floors as floor, j}
                        {#await fetchUndergroundFloorImage(floor) then imgUrl}
                        <div
                            class="underground-image {selectionG === group.id &&
                            selectionI === floor.id
                            ? 'selected'
                            : ''}"
                            data-group={group.id}
                            data-index={floor.id}
                            data-name={floor.name}
                            style="background-image: {`url(${imgUrl})`};
                            width: {Math.floor(floor.width)}px;
                            height: {Math.floor(floor.height)}px;
                            transform: translate(
                                {Math.floor(getImageX(floor.x, group.mapCode) - 5)}px,
                                {Math.floor(getImageY(floor.y, group.mapCode) - 3)}px);"
                            draggable="false"
                            use:portal={{ target: document.getElementById("mapsLayerUndergroundImage") }}
                        />
                        <button
                            role="tab"
                            aria-selected={selectionG === group.id && selectionI === floor.id}
                            tabindex={j}
                            class="underground-selection-item {selectionG === group.id &&
                            selectionI === floor.id
                            ? 'selected'
                            : ''}"
                            data-group={group.id}
                            data-index={floor.id}
                            data-name={(floor.name.length > 0) ? floor.name : "이름 없음"}
                            on:click={(e) => {
                            e.stopPropagation();
                            if (!isTouchScreen) {
                                e.preventDefault();
                            }
                            onClickSelection(group.id, floor.id);
                            return false;
                            }}
                        >
                            {(floor.name.length > 0) ? floor.name : "　"}
                        </button>
                        {/await}
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}
    {/await}
    </div>
</template>

<style lang="scss">
  #mapsLayerUnderground {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: none;

    &.active {
      display: block;
    }

    #mapsLayerUndergroundImage {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .underground-image {
        position: absolute;
        background-size: 100%;
        z-index: -1;
        opacity: 1;
        transition:
            filter 0.2s ease-in,
            opacity 0.2s ease-in;
        top: 0;
        left: 0;
        visibility: hidden;
        content-visibility: auto;
        user-select: none;
    }

    &.selected .underground-image {
        visibility: hidden;
        opacity: 0;
        /* filter: contrast(0.7) brightness(0.4) grayscale(0.8); */
    }

    &.selected .underground-image.selected {
        /* filter: none; */
        visibility: visible;
        opacity: 1;
        z-index: 0;
    }

    .underground-selection {
      position: absolute;
      z-index: 5;
      background: white;
      width: fit-content;
      height: fit-content;
      user-select: auto;
      display: block;
      border-radius: 15px 15px 0 0;
      content-visibility: auto;
      .underground-selection-head {
        padding: 5px;
        height: 20px;
        min-width: 200px;
        min-height: 25px;
        text-align: center;
        border-radius: 15px 15px 0 0;
        background: #d3bc8e;
        cursor: move;
      }
      .underground-selection-body {
        .underground-selection-item {
          display: block;
          width: 100%;
          border: none;
          text-align: left;
          padding: 5px;
          background: white;
          cursor: pointer;
          min-height: 24px; // calc(1rem + 8px);
          &:hover,
          &.selected {
            background: #f7f7d8;
          }
          &:not(:first-child) {
            border-top: 1px solid #d3bc8e;
          }
        }
      }
    }
  }
</style>
