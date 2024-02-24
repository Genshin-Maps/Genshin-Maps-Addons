<script lang="ts">
  import { isChestPinLoaded } from "@addons/stores";
  import { onMount } from "svelte";
  import { unsafeWindow } from "$";
  import { VanillaSelectBox } from "@addons/assets/select-box";

  let chestFilter: VanillaSelectBox;
  let isPinLoaded = false;
  isChestPinLoaded.subscribe((loaded) => {
    isPinLoaded = loaded;
    chestFilter?.setValue("all");
  });

  function redraw() {
    unsafeWindow.setPinObjectRefresh();
  }

  onMount(() => {
    chestFilter = new VanillaSelectBox("#chest-filter", {
      placeHolder: "상자 선택",
      translations: {
        all: "전체",
        item: "item",
        items: "items",
        selectAll: "전체",
        clearAll: "전체",
      },
      disableSelectAll: false,
      keepInlineStyles: false,
      keepInlineCaretStyles: false,
    });
    chestFilter.setValue("all");

    for (const node of chestFilter.ul?.childNodes || []) {
      const li = node as HTMLLIElement;
      if (li.dataset.value !== "all") {
        li.textContent += " ■";
      }
    }
  });

  export { chestFilter };
</script>

<template>
  <div class="chest-pin {isPinLoaded ? '' : 'hide'}">
    <div class="maps-addons-switch-label">상자 필터</div>
    <select id="chest-filter" multiple on:change={redraw}>
      <option value="평범한" style="color: gray;">평범한</option>
      <option value="정교한" style="color: #9ee0d4;">정교한</option>
      <option value="진귀한" style="color: #e6ba7b;">진귀한</option>
      <option value="화려한" style="color: #ff6c38;">화려한</option>
      <option value="신묘한" style="color: #accb29;">신묘한</option>
    </select>
  </div>
</template>

<style>
</style>
