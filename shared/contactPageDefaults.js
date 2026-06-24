const DEFAULT_CONTACT_PAGE = {
    show_hero_image: true,
    page_title: 'Contact',
    form_name_label: 'Name',
    form_email_label: 'Your email',
    form_subject_label: 'Subject',
    form_message_label: 'Message',
    form_submit_label: 'Submit',
    success_message: 'Message sent successfully.'
};

function mergeContactPageLabels(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    const text = (key) => {
        const value = base[key] != null ? String(base[key]).trim() : '';
        return value || DEFAULT_CONTACT_PAGE[key];
    };

    return {
        show_hero_image: base.show_hero_image !== false,
        page_title: text('page_title'),
        form_name_label: text('form_name_label'),
        form_email_label: text('form_email_label'),
        form_subject_label: text('form_subject_label'),
        form_message_label: text('form_message_label'),
        form_submit_label: text('form_submit_label'),
        success_message: text('success_message')
    };
}

module.exports = { DEFAULT_CONTACT_PAGE, mergeContactPageLabels };
