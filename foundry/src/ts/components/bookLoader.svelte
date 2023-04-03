<script lang="ts">
  export let message: string | undefined;
</script>

<span class="book-loader" />
{#if message}
  <span>{message}...</span>
{/if}

<style lang="scss">
  // $book-loader-color-cover: #979794;
  // $book-loader-color-page: #f5f5f5;
  // $book-loader-color-lines: #ddd;
  $book-loader-color-cover: #4b617d;
  $book-loader-color-page: #f5f5f5;
  $book-loader-color-lines: #ddd;

  .book-loader {
    width: 200px;
    height: 150px;
    background: $book-loader-color-cover;
    box-sizing: border-box;
    position: relative;
    border-radius: 8px;
    perspective: 1000px;
  }

  .book-loader:before {
    content: "";
    position: absolute;
    left: 10px;
    right: 10px;
    top: 10px;
    bottom: 10px;
    border-radius: 8px;
    background: $book-loader-color-page no-repeat;
    background-size: 60px 10px;
    background-image: linear-gradient(
        $book-loader-color-lines 100px,
        transparent 0
      ),
      linear-gradient($book-loader-color-lines 100px, transparent 0),
      linear-gradient($book-loader-color-lines 100px, transparent 0),
      linear-gradient($book-loader-color-lines 100px, transparent 0),
      linear-gradient($book-loader-color-lines 100px, transparent 0),
      linear-gradient($book-loader-color-lines 100px, transparent 0);

    background-position: 15px 30px, 15px 60px, 15px 90px, 105px 30px, 105px 60px,
      105px 90px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
  }

  .book-loader:after {
    content: "";
    position: absolute;
    width: calc(50% - 10px);
    right: 10px;
    top: 10px;
    bottom: 10px;
    border-radius: 8px;
    background: $book-loader-color-page no-repeat;
    background-size: 60px 10px;
    background-image: linear-gradient(
        $book-loader-color-lines 100px,
        transparent 0
      ),
      linear-gradient($book-loader-color-lines 100px, transparent 0),
      linear-gradient($book-loader-color-lines 100px, transparent 0);
    background-position: 50% 30px, 50% 60px, 50% 90px;
    transform: rotateY(0deg);
    transform-origin: left center;
    animation: paging 1s linear infinite;
  }

  @keyframes paging {
    to {
      transform: rotateY(-180deg);
    }
  }
</style>
