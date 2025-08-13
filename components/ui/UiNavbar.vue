<template>
  <nav :class="navbarClasses">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <slot name="logo">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <Icon
                v-if="logoIcon"
                :name="logoIcon"
                class="w-8 h-8 text-primary-500"
              />
              <span v-if="logoText" class="text-xl font-bold text-text-primary">
                {{ logoText }}
              </span>
            </NuxtLink>
          </slot>
        </div>

        <!-- Navigation (Unified for all screen sizes) -->
        <div class="flex-1 flex justify-center">
          <div class="flex items-baseline space-x-8">
            <slot name="navigation">
              <template v-for="item in navigationItems" :key="item.path">
                <NuxtLink
                  :to="item.path"
                  :class="navigationItemClasses"
                  active-class="text-primary-400 bg-primary-950"
                >
                  {{ item.label }}
                </NuxtLink>
              </template>
            </slot>
          </div>
        </div>

        <!-- Actions (Unified for all screen sizes) -->
        <div class="flex items-center space-x-4">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <!-- Mobile Navigation (Removed - using desktop design for all screen sizes) -->
  </nav>
</template>

<script setup lang="ts">
interface NavigationItem {
  label: string;
  path: string;
}

interface NavbarProps {
  logoText?: string;
  logoIcon?: string;
  navigationItems?: NavigationItem[];
  variant?: "default" | "transparent" | "bordered";
  sticky?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<NavbarProps>(), {
  navigationItems: () => [],
  variant: "default",
  sticky: false,
});

const mobileMenuOpen = ref(false);


const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const navbarClasses = computed(() => {
  const baseClasses = ["w-full", "z-30"];

  if (props.sticky) {
    baseClasses.push("sticky", "top-0");
  }

  const variantClasses = {
    default: ["bg-background-secondary", "border-b", "border-border-muted"],
    transparent: ["bg-transparent"],
    bordered: [
      "bg-background-primary",
      "border-b",
      "border-border-muted",
      "shadow-sm",
    ],
  };

  return [...baseClasses, ...variantClasses[props.variant], props.class]
    .filter(Boolean)
    .join(" ");
});

const navigationItemClasses = computed(() =>
  [
    "px-3",
    "py-2",
    "rounded-md",
    "text-sm",
    "font-medium",
    "text-text-secondary",
    "hover:text-text-primary",
    "hover:bg-background-elevated",
    "transition-colors",
    "duration-150",
  ].join(" ")
);


// Close mobile menu when clicking outside
onClickOutside(
  computed(() => document.querySelector("nav")),
  () => {
    if (mobileMenuOpen.value) {
      closeMobileMenu();
    }
  }
);

// Close mobile menu on route change
const route = useRoute();
watch(
  () => route.path,
  () => {
    closeMobileMenu();
  }
);
</script>
