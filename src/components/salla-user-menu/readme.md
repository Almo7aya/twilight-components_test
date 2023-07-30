# salla-user-menu



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute           | Description                                                 | Type      | Default |
| ------------------ | ------------------- | ----------------------------------------------------------- | --------- | ------- |
| `avatarOnly`       | `avatar-only`       | To display the trigger as an avatar only                    | `boolean` | `false` |
| `inline`           | `inline`            | To display only the list without the dropdown functionality | `boolean` | `false` |
| `relativeDropdown` | `relative-dropdown` | To Make the dropdown menu relative to parent element or not | `boolean` | `false` |
| `showHeader`       | `show-header`       | To display the dropdown header in mobile sheet              | `boolean` | `false` |


## Slots

| Slot          | Description                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `"login-btn"` | Replaces the login button, it must be used with `salla.event.dispatch('login::open')` to open the login modal. |
| `"trigger"`   | Replaces trigger widget, has replaceable props `{avatar}`, `{hello}`, `{first_name}`, `{last_name}`, `{icon}`. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
