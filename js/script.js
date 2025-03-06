$(function () {

  //ページ内スクロール
  var navHeight = $(".header").outerHeight();

  $('a[href^="#"]').on("click", function () {
    var href = $(this).attr("href");
    var target = $(href == "#" || href == "" ? "html" : href);
    var position = target.offset().top - navHeight;
    $("html, body").animate({ scrollTop: position, }, 300, "swing");
    return false;
  });

  //ページトップ
  $("#js-page-top").on("click", function () {
    $("body,html").animate({ scrollTop: 0, }, 300);
    return false;
  });

});

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const closeButton = document.querySelector(".close");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");

  let currentIndex = 0;
  let images = [];

  // 画像クリック時の処理
  document.querySelectorAll(".clickable-image").forEach((image) => {
    image.addEventListener("click", function () {
      const imgWrap = this.closest(".img_wrap");
      if (imgWrap) {
        images = imgWrap.getAttribute("data-images").split(",");
        currentIndex = images.indexOf(this.getAttribute("src"));
        updateModalImage();
        modal.style.display = "block";
      }
    });
  });

  // モーダルの画像更新
  function updateModalImage() {
    if (images.length > 0) {
      modalImage.src = images[currentIndex];
    }
  }

  // 次の画像へ
  nextButton.addEventListener("click", function () {
    currentIndex = (currentIndex + 1) % images.length;
    updateModalImage();
  });

  // 前の画像へ
  prevButton.addEventListener("click", function () {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateModalImage();
  });

  // モーダルを閉じる
  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
  });

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

