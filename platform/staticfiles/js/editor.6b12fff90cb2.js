(function(){
  "use strict";
  var root = document.documentElement;
  if (!root.hasAttribute('data-editor')) return;

  var csrfToken = (document.querySelector('[name=csrfmiddlewaretoken]') || {}).value || '';
  var saveFieldUrl = root.getAttribute('data-save-field-url');
  var saveSocialUrl = root.getAttribute('data-save-social-url');
  var uploadLogoUrl = root.getAttribute('data-upload-logo-url');
  var addImageUrl = root.getAttribute('data-add-image-url');
  var toggleSectionUrlTpl = root.getAttribute('data-toggle-section-url-template');
  var deleteImageUrlTpl = root.getAttribute('data-delete-image-url-template');
  var moveSectionUpUrlTpl = root.getAttribute('data-move-section-up-url-template');
  var moveSectionDownUrlTpl = root.getAttribute('data-move-section-down-url-template');

  var statusEl = document.querySelector('.editor-status');
  var flashTimer = null;
  function flashStatus(text, isError){
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('is-error', !!isError);
    statusEl.classList.add('is-visible');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function(){ statusEl.classList.remove('is-visible'); }, 1800);
  }

  function postForm(url, fields){
    var fd = new FormData();
    Object.keys(fields || {}).forEach(function(k){ fd.append(k, fields[k]); });
    fd.append('csrfmiddlewaretoken', csrfToken);
    return fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function(r){ return r.json().then(function(json){ return { ok: r.ok, json: json }; }); })
      .catch(function(){ return { ok: false, json: {} }; });
  }

  function postFile(url, fieldName, file){
    var fd = new FormData();
    fd.append(fieldName, file);
    fd.append('csrfmiddlewaretoken', csrfToken);
    return fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function(r){ return r.json().then(function(json){ return { ok: r.ok, json: json }; }); })
      .catch(function(){ return { ok: false, json: {} }; });
  }

  /* ---------------- Plain text fields (business name, tagline, bio, phone, address, hours, about) ---------------- */
  document.querySelectorAll('[data-editable-field]').forEach(function(el){
    el.setAttribute('contenteditable', 'true');
    var field = el.getAttribute('data-editable-field');
    var singleline = el.hasAttribute('data-singleline');
    var original = el.innerText.trim();

    if (singleline){
      el.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){ e.preventDefault(); el.blur(); }
      });
    }

    el.addEventListener('blur', function(){
      // innerText (not textContent) so multi-line fields like bio keep
      // their line breaks — textContent silently drops them across
      // contenteditable's internal block boundaries.
      var value = el.innerText.trim();
      if (value === original) return;
      original = value;
      postForm(saveFieldUrl, { field: field, value: value }).then(function(res){
        flashStatus(res.ok && res.json.ok ? 'Saved' : 'Could not save', !(res.ok && res.json.ok));
      });
    });
  });

  /* ---------------- Social link rows ---------------- */
  document.querySelectorAll('[data-social-field]').forEach(function(el){
    el.setAttribute('contenteditable', 'true');
    var platform = el.getAttribute('data-social-field');
    var original = el.innerText.trim();
    el.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', function(){
      var value = el.innerText.trim();
      if (value === original) return;
      original = value;
      postForm(saveSocialUrl, { platform: platform, url: value }).then(function(res){
        flashStatus(res.ok && res.json.ok ? 'Saved' : 'Could not save', !(res.ok && res.json.ok));
      });
    });
  });

  /* ---------------- Image upload (logo + gallery) — reloads on success so the new file shows in the right place every time ---------------- */
  document.querySelectorAll('[data-editable-image]').forEach(function(wrap){
    var kind = wrap.getAttribute('data-editable-image'); // "logo" or "gallery"
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    wrap.appendChild(input);

    wrap.addEventListener('click', function(e){
      e.preventDefault();
      input.click();
    });

    input.addEventListener('change', function(){
      var file = input.files[0];
      if (!file) return;
      var url = kind === 'logo' ? uploadLogoUrl : addImageUrl;
      var fieldName = kind === 'logo' ? 'logo' : 'image';
      flashStatus('Uploading…');
      postFile(url, fieldName, file).then(function(res){
        if (res.ok && res.json.ok){ location.reload(); }
        else { flashStatus((res.json && res.json.error) || 'Could not upload', true); }
      });
    });
  });

  document.querySelectorAll('[data-delete-image]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if (!confirm('Remove this photo?')) return;
      var id = btn.getAttribute('data-delete-image');
      var url = deleteImageUrlTpl.replace('__ID__', id);
      postForm(url, {}).then(function(res){
        if (res.ok && res.json.ok) location.reload();
      });
    });
  });

  /* ---------------- Section show/hide ---------------- */
  document.querySelectorAll('[data-toggle-section]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var id = btn.getAttribute('data-toggle-section');
      var url = toggleSectionUrlTpl.replace('__ID__', id);
      postForm(url, {}).then(function(res){
        if (res.ok && res.json.ok){
          var wrap = btn.closest('[data-section-wrap]');
          if (wrap) wrap.classList.toggle('is-section-hidden', !res.json.is_enabled);
          btn.textContent = res.json.is_enabled ? 'Hide section' : 'Show section';
          flashStatus(res.json.is_enabled ? 'Section shown' : 'Section hidden');
        }
      });
    });
  });

  /* ---------------- Section reorder ---------------- */
  document.querySelectorAll('[data-move-section]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      if (btn.disabled) return;
      btn.disabled = true;
      flashStatus('Moving…');
      var id = btn.getAttribute('data-move-section');
      var direction = btn.getAttribute('data-direction');
      var tpl = direction === 'up' ? moveSectionUpUrlTpl : moveSectionDownUrlTpl;
      var url = tpl.replace('__ID__', id);
      postForm(url, {}).then(function(res){
        // Order changes rearrange the whole page, so just reload rather
        // than reconstruct the DOM — same approach as image uploads.
        if (res.ok && res.json.ok) location.reload();
        else { btn.disabled = false; flashStatus('Could not move section', true); }
      });
    });
  });

  /* ---------------- Structured card lists: title / subtitle / tag
     (Services, Team — any section storing lines as "Title — subtitle [Tag]") ---------------- */
  document.querySelectorAll('[data-services-editor]').forEach(function(servicesRoot){
    var fieldName = servicesRoot.getAttribute('data-services-field') || 'services_body';
    var grid = servicesRoot.querySelector('.store-services-grid, .store-team-grid');
    if (!grid) return;

    function serializeServices(){
      var lines = [];
      grid.querySelectorAll('[data-service-card]').forEach(function(card){
        var titleEl = card.querySelector('[data-service-title]');
        var title = titleEl ? titleEl.innerText.trim() : '';
        if (!title) return;
        var subEl = card.querySelector('[data-service-sub]');
        var sub = subEl ? subEl.innerText.trim() : '';
        var tag = card.getAttribute('data-tag') || '';
        var line = title;
        if (sub) line += ' — ' + sub;
        if (tag) line += ' [' + tag + ']';
        lines.push(line);
      });
      return lines.join('\n');
    }

    function saveServices(){
      postForm(saveFieldUrl, { field: fieldName, value: serializeServices() }).then(function(res){
        flashStatus(res.ok && res.json.ok ? 'Saved' : 'Could not save', !(res.ok && res.json.ok));
      });
    }

    grid.addEventListener('focusout', function(e){
      if (e.target.matches && e.target.matches('[data-service-title], [data-service-sub]')) saveServices();
    });
    grid.addEventListener('keydown', function(e){
      // Both are single-line in storage — a stray newline here would
      // split into a bogus extra line when the body is re-parsed.
      if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-service-title], [data-service-sub]')){
        e.preventDefault();
        e.target.blur();
      }
    });

    function bindRemove(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('[data-service-card]');
        if (card) card.remove();
        saveServices();
      });
    }
    grid.querySelectorAll('[data-service-remove]').forEach(bindRemove);

    var addBtn = servicesRoot.querySelector('[data-service-add]');
    if (addBtn){
      addBtn.addEventListener('click', function(){
        var isTeam = grid.classList.contains('store-team-grid');
        var card = document.createElement('div');
        card.className = isTeam ? 'store-team-card' : 'store-service-card';
        card.setAttribute('data-service-card', '');
        card.setAttribute('data-tag', '');
        card.innerHTML =
          (isTeam ? '<div class="store-team-card-avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></div>' : '') +
          '<button type="button" class="service-remove-btn" data-service-remove aria-label="Remove">&times;</button>' +
          '<div class="' + (isTeam ? 'store-team-card-title' : 'store-service-card-title') + '" data-service-title contenteditable="true">' + (isTeam ? 'New team member' : 'New service') + '</div>' +
          '<div class="' + (isTeam ? 'store-team-card-sub' : 'store-service-card-sub') + '" data-service-sub contenteditable="true">' + (isTeam ? 'Role' : 'Short description') + '</div>';
        grid.insertBefore(card, addBtn);
        bindRemove(card.querySelector('[data-service-remove]'));
        saveServices();
      });
    }
  });
})();
