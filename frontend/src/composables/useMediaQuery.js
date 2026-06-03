import { ref, onMounted, onUnmounted } from 'vue';

export function useMediaQuery(query) {
  const matches = ref(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  let mq = null;

  function sync() {
    matches.value = mq?.matches ?? false;
  }

  onMounted(() => {
    mq = window.matchMedia(query);
    sync();
    mq.addEventListener('change', sync);
  });

  onUnmounted(() => {
    mq?.removeEventListener('change', sync);
  });

  return matches;
}
