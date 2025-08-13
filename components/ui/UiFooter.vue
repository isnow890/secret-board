<template>
  <footer :class="footerClasses">
    <div class="container mx-auto px-6">
      <div v-if="!minimal" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
        <!-- Company Info -->
        <div class="lg:col-span-1">
          <slot name="brand">
            <div class="flex items-center space-x-2 mb-4">
              <Icon v-if="logoIcon" :name="logoIcon" class="w-8 h-8 text-primary-500" />
              <span v-if="logoText" class="text-xl font-bold text-text-primary">
                {{ logoText }}
              </span>
            </div>
            <p v-if="description" class="text-text-secondary text-sm leading-relaxed max-w-sm">
              {{ description }}
            </p>
          </slot>
        </div>
        
        <!-- Links Sections -->
        <div v-for="section in linkSections" :key="section.title" class="lg:col-span-1">
          <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            {{ section.title }}
          </h3>
          <ul class="space-y-3">
            <li v-for="link in section.links" :key="link.label">
              <component
                :is="link.external ? 'a' : 'NuxtLink'"
                :to="link.external ? undefined : link.path"
                :href="link.external ? link.path : undefined"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="text-text-secondary hover:text-text-primary transition-colors duration-150 text-sm"
              >
                {{ link.label }}
                <Icon v-if="link.external" name="lucide:external-link" class="w-3 h-3 ml-1 inline-block" />
              </component>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Bottom Section -->
      <div :class="bottomSectionClasses">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <!-- Copyright -->
          <div class="flex items-center space-x-4 text-sm text-text-tertiary">
            <slot name="copyright">
              <span v-if="copyright">{{ copyright }}</span>
              <span v-else>&copy; {{ currentYear }} All rights reserved.</span>
            </slot>
          </div>
          
          <!-- Social Links -->
          <div v-if="socialLinks.length > 0" class="flex items-center space-x-4">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.name"
              class="text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              <Icon :name="social.icon" class="w-5 h-5" />
            </a>
          </div>
          
          <!-- Additional Actions -->
          <div v-if="$slots.actions" class="flex items-center space-x-4">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
interface FooterLink {
  label: string
  path: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface SocialLink {
  name: string
  url: string
  icon: string
}

interface FooterProps {
  logoText?: string
  logoIcon?: string
  description?: string
  copyright?: string
  linkSections?: FooterSection[]
  socialLinks?: SocialLink[]
  variant?: 'default' | 'minimal' | 'bordered'
  minimal?: boolean
  class?: string
}

const props = withDefaults(defineProps<FooterProps>(), {
  linkSections: () => [],
  socialLinks: () => [],
  variant: 'default',
  minimal: false
})

const currentYear = computed(() => new Date().getFullYear())

const footerClasses = computed(() => {
  const baseClasses = ['w-full']

  const variantClasses = {
    default: [
      'bg-background-secondary',
      'border-t',
      'border-border-muted'
    ],
    minimal: [
      'bg-background-primary',
      'border-t',
      'border-border-muted'
    ],
    bordered: [
      'bg-background-primary',
      'border-t-2',
      'border-border-muted'
    ]
  }

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    props.class
  ].filter(Boolean).join(' ')
})

const bottomSectionClasses = computed(() => {
  const baseClasses = ['border-t', 'border-border-muted']
  
  if (props.minimal) {
    return [...baseClasses, 'py-6'].join(' ')
  } else {
    return [...baseClasses, 'py-6', 'mt-8'].join(' ')
  }
})
</script>