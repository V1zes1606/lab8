/*jslint browser */

window.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const FORM_ENDPOINT = "https://formcarry.com/s/VJRJ0BwTJTa";
    const STORAGE_KEY = "feedbackFormData";
    const FEEDBACK_HASH = "#feedback";

    const modal = document.getElementById("fb-modal");
    const closeBtn = document.getElementById("fb-close");
    const form = document.getElementById("fb-form");
    const statusBox = document.getElementById("fb-status");
    const submitBtn = document.getElementById("fb-submit");
    const openButtons = document.querySelectorAll(".js-open-feedback");

    const fields = {
        consent: document.getElementById("fb-consent"),
        email: document.getElementById("fb-email"),
        fio: document.getElementById("fb-fio"),
        message: document.getElementById("fb-message"),
        organization: document.getElementById("fb-organization"),
        phone: document.getElementById("fb-phone")
    };

    let pushedHistory = false;

    function showStatus(text, isError) {
        statusBox.textContent = text;
        statusBox.classList.remove("fb-status-success", "fb-status-error");
        if (!text) {
            return;
        }
        if (isError) {
            statusBox.classList.add("fb-status-error");
        } else {
            statusBox.classList.add("fb-status-success");
        }
    }

    function getFormValues() {
        return {
            consent: fields.consent.checked,
            email: fields.email.value,
            fio: fields.fio.value,
            message: fields.message.value,
            organization: fields.organization.value,
            phone: fields.phone.value
        };
    }

    function saveToStorage() {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(getFormValues())
            );
            return true;
        } catch (ignore) {
            return false;
        }
    }

    function restoreFromStorage() {
        let raw;
        let saved;

        try {
            raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return false;
            }
            saved = JSON.parse(raw);
        } catch (ignore) {
            return false;
        }

        if (!saved || typeof saved !== "object") {
            return false;
        }

        fields.fio.value = saved.fio || "";
        fields.email.value = saved.email || "";
        fields.phone.value = saved.phone || "";
        fields.organization.value = saved.organization || "";
        fields.message.value = saved.message || "";
        fields.consent.checked = Boolean(saved.consent);
        return true;
    }

    function clearFormData() {
        form.reset();
        try {
            window.localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (ignore) {
            return false;
        }
    }

    function showModal() {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("fb-modal-open");
    }

    function hideModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("fb-modal-open");
    }

    function openModalWithHistory() {
        showStatus("", false);
        showModal();
        if (window.location.hash !== FEEDBACK_HASH) {
            window.history.pushState(
                {
                    feedbackOpen: true
                },
                "",
                FEEDBACK_HASH
            );
            pushedHistory = true;
        }
    }

    function closeModalWithHistory() {
        if (!modal.classList.contains("is-open")) {
            return;
        }
        if (pushedHistory && window.location.hash === FEEDBACK_HASH) {
            pushedHistory = false;
            window.history.back();
            return;
        }
        hideModal();
        if (window.location.hash === FEEDBACK_HASH) {
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        }
    }

    function handleSubmit(event) {
        const payload = getFormValues();

        event.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка...";
        showStatus("", false);

        window.fetch(FORM_ENDPOINT, {
            body: JSON.stringify(payload),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            method: "POST"
        }).then(function (response) {
            return response.json().then(function (data) {
                return {
                    data: data,
                    ok: response.ok
                };
            }).catch(function () {
                return {
                    data: null,
                    ok: response.ok
                };
            });
        }).then(function (result) {
            const hasApiError = Boolean(
                result.data && result.data.status === "error"
            );

            submitBtn.disabled = false;
            submitBtn.textContent = "Отправить";

            if (!result.ok || hasApiError) {
                showStatus(
                    "Ошибка при отправке формы. Попробуйте еще раз.",
                    true
                );
                return;
            }

            clearFormData();
            showStatus("Сообщение успешно отправлено!", false);
        }).catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = "Отправить";
            showStatus(
                "Ошибка сети. Не удалось отправить данные на сервер.",
                true
            );
        });
    }

    if (!modal || !form || !closeBtn || !statusBox || !submitBtn) {
        return;
    }

    restoreFromStorage();

    openButtons.forEach(function (button) {
        button.addEventListener("click", openModalWithHistory);
    });

    closeBtn.addEventListener("click", closeModalWithHistory);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModalWithHistory();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModalWithHistory();
        }
    });

    form.addEventListener("input", saveToStorage);
    form.addEventListener("change", saveToStorage);
    form.addEventListener("submit", handleSubmit);

    window.addEventListener("popstate", function () {
        if (window.location.hash === FEEDBACK_HASH) {
            showModal();
        } else {
            pushedHistory = false;
            hideModal();
        }
    });

    if (window.location.hash === FEEDBACK_HASH) {
        showModal();
    }
});