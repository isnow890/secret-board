<template>
  <div>
    <h1>에러 테스트 페이지</h1>
    <button @click="throwError">에러 발생시키기</button>
  </div>
</template>

<script setup lang="ts">
const throwError = () => {
  throw createError({
    statusCode: 500,
    statusMessage: '테스트 에러',
    message: '이것은 테스트용 에러입니다.'
  })
}
</script>