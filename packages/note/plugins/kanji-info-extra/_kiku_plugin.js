/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  KanjiInfoExtra: (props) => {
    const { onMount } = props.ctx;
    const { checkboxRef, sections } = props;
    const { CommonWords, VisuallySimilar, ComposedOf, UsedIn, Meanings, Related } = sections;

    /** @param {HTMLInputElement} checkbox */
    function openSection(checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));
    }

    onMount(() => {
      /** You can expand the sections by default by doing the following */
      // if (checkboxRef.visuallySimilar) openSection(checkboxRef.visuallySimilar);
      if (checkboxRef.composedOf) openSection(checkboxRef.composedOf);
      // if (checkboxRef.usedIn) openSection(checkboxRef.usedIn);
      if (checkboxRef.meanings) openSection(checkboxRef.meanings);
      // if (checkboxRef.related) openSection(checkboxRef.related);
    });

    return [
      /** You can customize the order here */
      CommonWords(),
      VisuallySimilar(),
      ComposedOf(),
      UsedIn(),
      Meanings(),
      Related(),
    ];
  },
};
