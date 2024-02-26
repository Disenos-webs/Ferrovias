/**
 * A lightweight youtube embed. Still should feel the same to the user, just MUCH faster to initialize and paint.
 *
 * Thx to these as the inspiration
 *   https://storage.googleapis.com/amp-vs-non-amp/youtube-lazy.html
 *   https://autoplay-youtube-player.glitch.me/
 *
 * Once built it, I also found these:
 *   https://github.com/ampproject/amphtml/blob/master/extensions/amp-youtube (👍👍)
 *   https://github.com/Daugilas/lazyYT
 *   https://github.com/vb/lazyframe
 */
class LiteYTEmbed extends HTMLElement {
   connectedCallback() {
      this.videoId = this.getAttribute('videoid');

      let playBtnEl = this.querySelector('.lty-playbtn');
      // A label for the button takes priority over a [playlabel] attribute on the custom-element
      this.playLabel = (playBtnEl && playBtnEl.textContent.trim()) || this.getAttribute('playlabel') || 'Play';
      
      // A label for the button takes priority over a [playlabel] attribute on the custom-element
      if (!this.style.backgroundImage) {
         this.dataset.bg = `https://i.ytimg.com/vi/${this.videoId}/maxresdefault.jpg`
         this.style.backgroundImage = `url("${ferro.img}Ferrovias_bg_red.jpg")`;
      }
      if (!playBtnEl) {
           playBtnEl = document.createElement('button');
           playBtnEl.type = 'button';
           playBtnEl.classList.add('lty-playbtn');
           this.append(playBtnEl);
       }
       if (!playBtnEl.textContent) {
           const playBtnLabelEl = document.createElement('span');
           playBtnLabelEl.className = 'lyt-visually-hidden';
           playBtnLabelEl.textContent = this.playLabel;
           playBtnEl.append(playBtnLabelEl);
       }
       playBtnEl.removeAttribute('href');
      // Añadimos el logo del sitio
      let logosite = this.querySelector('.logo-site');
      logosite = document.createElement('img');
      logosite.src = ferro.img + 'favicon.ico';
      logosite.alt = ferro.title;
      logosite.classList.add('lty-logosite');
      this.append(logosite);

      this.addEventListener('pointerover', LiteYTEmbed.warmConnections, {once: true});
      this.addEventListener('click', this.addIframe);
   }

    /**
     * Add a <link rel={preload | preconnect} ...> to the head
     */
   static addPrefetch(kind, url, as) {
      const linkEl = document.createElement('link');
      linkEl.rel = kind;
      linkEl.href = url;
      if (as) linkEl.as = as;
      document.head.append(linkEl);
   }

   static warmConnections() {
      if (LiteYTEmbed.preconnected) return;
      LiteYTEmbed.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
      LiteYTEmbed.addPrefetch('preconnect', 'https://www.google.com');
      LiteYTEmbed.addPrefetch('preconnect', 'https://googleads.g.doubleclick.net');
      LiteYTEmbed.addPrefetch('preconnect', 'https://static.doubleclick.net');

      LiteYTEmbed.preconnected = true;
   }

   fetchYTPlayerApi() {
      if (window.YT || (window.YT && window.YT.Player)) return;
      this.ytApiPromise = new Promise((res, rej) => {
         var el = document.createElement('script');
         el.src = 'https://www.youtube.com/iframe_api';
         el.async = true;
         el.onload = _ => YT.ready(res);
         el.onerror = rej;
         this.append(el);
      });
   }

   async addYTPlayerIframe(params) {
      this.fetchYTPlayerApi();
      await this.ytApiPromise;
      const videoPlaceholderEl = document.createElement('div')
      this.append(videoPlaceholderEl);
      const paramsObj = Object.fromEntries(params.entries());
      new YT.Player(videoPlaceholderEl, {
         width: '100%',
         videoId: this.videoId,
         playerVars: paramsObj,
         events: {
            'onReady': event => {
               event.target.playVideo();
            }
         }
      });
   }

   async addIframe(){
      if (this.classList.contains('lyt-activated')) return;
      this.classList.add('lyt-activated');
      const params = new URLSearchParams(this.getAttribute('params') || []);
      params.append('autoplay', '1');
      params.append('playsinline', '1');
      if (this.needsYTApiForAutoplay) return this.addYTPlayerIframe(params);
      const iframeEl = document.createElement('iframe');
      iframeEl.width = 560;
      iframeEl.height = 315;
      iframeEl.title = this.playLabel;
      iframeEl.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframeEl.allowFullscreen = true;
      iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${params.toString()}`;
      this.append(iframeEl);
      iframeEl.focus();
   }
}
// Register custom element
customElements.define('lite-youtube', LiteYTEmbed);