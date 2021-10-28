(function () {
  'use strict';

  const userBlock = document.querySelector(`.user`);
  const userPopup = userBlock.querySelector(`.user__popup`);
  const closePopup = userBlock.querySelector(`.user__popup-close`);
  const overlay = document.querySelector(`.overlay`);

  const closePopupOnClick = (evt) => {
    // evt.preventDefault();
    userPopup.style.display = `none`;
    overlay.style.display = `none`;
    setTimeout(() => {
      userBlock.addEventListener(`click`, userOnClick);
    }, 100);
  };

  const userOnClick = () => {
    userPopup.style.display = `flex`;
    overlay.style.display = `block`;
    userBlock.removeEventListener(`click`, userOnClick);
  };

  if (userBlock) {
    userBlock.addEventListener(`click`, userOnClick);
    closePopup.addEventListener(`click`, closePopupOnClick);
    overlay.addEventListener(`click`, closePopupOnClick);
  }

  const application = document.querySelector(`.application`);
  const apps = application.querySelector(`.apps`);

  const nameParser = (nameKey) => {
    let convertedName = nameKey.replace(`_`, ` `);
    convertedName.trim();
    return convertedName.replace(convertedName[0], convertedName[0].toUpperCase());};

  function escapeHTML(unsafeText) {
    let div = document.createElement('div');
    div.innerText = unsafeText;
    return div.innerHTML;
  }

  const profileStringHandler = (key, value, editable) => {
    const editBtn = editable ? `
    <svg class="profile__edit" id="profile_edit_${key}" width="24" height="24">
      <use xlink:href="${window.imgPath}/sprite.svg#icon-edit"></use>
    </svg>` : ``;
    return `<div class="profile__field">
  <div class="profile__name">${nameParser(key)}:</div>
  <div class="profile__content profile__content--long">${escapeHTML(value)}</div>${editBtn}
</div>`;
  };


  const profileDateHandler = (key, value) => {
    const convertedDate = new Date(value).toUTCString();

    return `<div class="profile__field">
    <div class="profile__name">${nameParser(key)}:</div>
    <div class="profile__content">${convertedDate}</div>
  </div>`
  };

  const profileArrayHandler = (key, value) => {
    let itemsLayout = ``;
    value.forEach((item) => {
      itemsLayout += `<li class="profile__item">${escapeHTML(item)}</li>`;
    });

    return `<div class="profile__field">
    <div class="profile__name">${nameParser(key)}:</div>
    <div class="profile__content profile__content--groups profile__content--long">
      <ul class="profile__list">
        ${itemsLayout}
      </ul>
    </div>
  </div>`;
  };

  const backBtnOnClick = (profileElement) => {
    apps.style.display = `block`;
    profileElement.style.display = `none`;
  };

  const editBtnOnClick = (profileElement, key, value, xsrf) => {
    const editBtn = profileElement.querySelector(`#profile_edit_${key}`);
    if (!editBtn) return;
    const profileContentElement = editBtn.parentElement.querySelector('.profile__content');
    const elementEditForm = `<form action="" method="POST">
  <input type="text" class="profile-input" name="edit_${key}"/>
  <input type="hidden" name="action" value="edit_${key}"/>
  ${xsrf}
  <button type="submit">Change</button>
  </form>`;
    editBtn.parentElement.removeChild(editBtn);
    profileContentElement.innerHTML = elementEditForm;
    profileContentElement.querySelector('.profile-input').value = value;
  };

  const profileBtnOnClick = (dictObj, editableKeys, xsrf_form_html) => {
    closePopupOnClick();
    apps.style.display = `none`;

    const profile = application.querySelector(`.profile`);

    if (profile) {
      profile.style.display = `flex`;
    } else {
      let profileLayout = `
    <h1 class="heading heading--h1 heading--center heading--marginBottom-15 heading--light"><span class="profile__back"><span class="profile__backIcon"></span></span>User Profile</h1>`;

        for (const [key, value] of Object.entries(dictObj)) {
          const editable = editableKeys? editableKeys.includes(key) : false;
          // Currently only string values can be editable
          if (typeof value === `number`) {
            profileLayout += profileDateHandler(key, value);
          }
          if (Array.isArray(value)){
            profileLayout += profileArrayHandler(key, value);
          }
          if (typeof value === `string`) {
            profileLayout += profileStringHandler(key, value, editable);
          }

        }
        profileLayout += `<button class="button button--common button--marginBottom-0 button--back">Back to Applications</button>`;

      const profileElement = document.createElement(`div`);
      profileElement.classList.add(`profile`);
      profileElement.innerHTML = profileLayout;
      const backBtn = profileElement.querySelector(`.button--back`);
      backBtn.addEventListener(`click`, () => {
        backBtnOnClick(profileElement);
      });
      const backIcon = profileElement.querySelector(`.profile__back`);
      backIcon.addEventListener(`click`, () => {
        backBtnOnClick(profileElement);
      });
      if (editableKeys) {
        for (const key of editableKeys) {
          const editBtn = profileElement.querySelector(`#profile_edit_${key}`);
          if (editBtn) {
            editBtn.addEventListener(`click`, (e)=> {
              editBtnOnClick(profileElement, key, dictObj[key], xsrf_form_html);
              e.preventDefault();
            });
          }
        }
      }

      application.appendChild(profileElement);
    }
  };

  window.profileBtnOnClick = profileBtnOnClick;

}());

//# sourceMappingURL=application.js.map
