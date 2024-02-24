<script lang="ts">
  import {
    isFilterPinActive,
    isUndergroundMapActive,
    isChestPinLoaded,
  } from "@addons/stores";
  import "@addons/assets/select-box.css";
  import "@addons/assets/addons.css";
  import { VanillaSelectBox } from "@addons/assets/select-box";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import FilterChest from "@addons/filter-chest/index.svelte";
  import FilterPin from "@addons/filter-pin/index.svelte";
  import UndergroundMapLayer from "@addons/underground-layer/index.svelte";
  import UndergroundMapButton from "@addons/underground-map-button/index.svelte";
  import { makeObservable } from "@addons/observable";
  import type { MapData, PinLoad } from "@t.addons/index";
  import { unsafeWindow } from "$";

  let chestFilter: VanillaSelectBox;
  let filterPin: FilterPin;
  let undergroundMapLayer: UndergroundMapLayer;
  function init() {
    // 게임닷 맵스 메소드 오버라이드
    unsafeWindow.drawMapsLayer = (function (originDrawMapsLayer) {
      "use strict";
      return (boolPanelHide: boolean) => {
        originDrawMapsLayer(boolPanelHide);
        adjustPin();
        undergroundMapLayer.redraw();
        filterPin.removeUnnecessary();
      };
    })(unsafeWindow.drawMapsLayer);

    unsafeWindow.removePin = (function (originRemovePin) {
      "use strict";

      const _proxyLoadedPin = () => {
        isChestPinLoaded.set(
          unsafeWindow.MAPS_PinLoad.filter((value: PinLoad) =>
            value.name?.includes("보물상자")
          ).length > 0
        );
        unsafeWindow.MAPS_PinLoad = makeObservable(unsafeWindow.MAPS_PinLoad);
        unsafeWindow.MAPS_PinLoad.observe((_: number, value: PinLoad) => {
          if (
            Object.prototype.toString.call(value) == "[object Object]" &&
            value.name?.includes("보물상자")
          ) {
            isChestPinLoaded.set(true);
          }
        });
      };

      _proxyLoadedPin();
      return (boolGroup: boolean, pinIndex: number, boolTabUpdate: boolean) => {
        originRemovePin(boolGroup, pinIndex, boolTabUpdate);
        _proxyLoadedPin();
      };
    })(unsafeWindow.removePin);
  }

  function adjustPin() {
    if (
      Object.prototype.toString.call(unsafeWindow.MAPS_ViewPin) !=
        "[object Set]" ||
      unsafeWindow.MAPS_ViewPin.size <= 0
    )
      return;

    const selectedValues = chestFilter.getResult();
    const OBJECT_PIN_LAYER = document.getElementById("mapsLayerPoint");
    unsafeWindow.MAPS_ViewPin.forEach((v: string) => {
      const arrDrawPin = unsafeWindow.MAPS_PinDraw.get(v);
      if (
        Object.prototype.toString.call(arrDrawPin) != "[object Array]" ||
        arrDrawPin.length <= 0
      )
        return true;

      let mapPinGroup = new Map<
        number,
        {
          x: number;
          y: number;
          state: number;
          length: number;
          points: MapData[];
          point: MapData;
        }
      >();
      arrDrawPin.forEach((point: MapData) => {
        const arrPinData = unsafeWindow.MAPS_PinLoad[point.pin];
        if (point.category && arrPinData.category[point.category]) {
          const arrCategory = arrPinData.category[point.category];
          if (arrPinData.name?.includes("보물상자")) {
            if (selectedValues.includes(arrCategory.name) == false) {
              document
                .querySelector(
                  `.maps-point[data-pin="${point.pin}"][data-point="${point.point}"]`
                )
                ?.remove();
              return true;
            }
          }
        }
        if (unsafeWindow.MAPS_State.pinGroup == true) {
          // 핀 그룹화를 위해 평균 구하기.
          let arrPinGroup = mapPinGroup.get(point.pin);
          arrPinGroup = arrPinGroup
            ? arrPinGroup
            : { x: 0, y: 0, state: 0, length: 0, points: [], point: point };
          arrPinGroup.x += point.x;
          arrPinGroup.y += point.y;
          arrPinGroup.points.push(point);
          arrPinGroup.length++;
          arrPinGroup.state = point.state
            ? arrPinGroup.state + 1
            : arrPinGroup.state;

          mapPinGroup.set(point.pin, arrPinGroup);
          return false;
        }
        return true;
      });

      if (unsafeWindow.MAPS_State.pinGroup) {
        let constants = {
          isFilterPinActive: get(isFilterPinActive),
          isUndergroundMapActive: get(isUndergroundMapActive),
        };
        mapPinGroup.forEach((value) => {
          const arrData = v.split("/", 2);
          let state = 0;
          let length = 0;
          let x = 0;
          let y = 0;
          for (const point of value.points) {
            const pin = document.querySelector(
              `.maps-point[data-pin="${point.pin}"][data-point="${point.point}"]`
            );
            if (pin) {
              pin.remove();
            }
            const isUnderground = point.tag?.includes("지하");
            if (
              constants.isFilterPinActive &&
              constants.isUndergroundMapActive !== isUnderground
            ) {
              continue;
            }
            if (point.state) {
              state++;
            }
            x += point.x;
            y += point.y;
            length++;
          }

          let objectPoint: HTMLDivElement;
          if (length > 1) {
            objectPoint = unsafeWindow.drawPinObject(
              true,
              value.point,
              arrData
            );
            objectPoint.className = "maps-point group";

            let objectCount = document.createElement("p");
            objectCount.innerText = state + "/" + length;
            objectPoint.querySelector("div").appendChild(objectCount);
            let groupX = x / length;
            let groupY = y / length;

            objectPoint.setAttribute(
              "style",
              "transform: translate(" +
                (groupX + unsafeWindow.MAPS_RelativeX) +
                "px, " +
                (groupY + unsafeWindow.MAPS_RelativeY) +
                "px);"
            );
            objectPoint.setAttribute(
              "data-state",
              state == length ? "true" : "false"
            );
            objectPoint.removeAttribute("data-tip");
            if (constants.isUndergroundMapActive) {
              objectPoint.setAttribute("data-strata", "underground");
            } else {
              objectPoint.removeAttribute("data-strata");
            }

            // 사이즈 설정
            objectPoint.style.marginLeft = objectPoint.style.marginTop =
              "-64px";
            OBJECT_PIN_LAYER.appendChild(objectPoint);
          } else {
            for (const point of value.points) {
              objectPoint = unsafeWindow.drawPinObject(false, point, arrData);
              OBJECT_PIN_LAYER.appendChild(objectPoint);
            }
          }
        });
      }
      return true;
    });
  }

  onMount(() => {
    init();
  });
</script>

<template>
  <div class="maps-addons">
    <FilterChest bind:chestFilter />
    <FilterPin bind:this={filterPin} />
    <UndergroundMapLayer bind:this={undergroundMapLayer} />
    <UndergroundMapButton />
  </div>
</template>

<style>
</style>
