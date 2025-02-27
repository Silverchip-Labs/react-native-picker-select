import React, { PureComponent } from 'react';
import {
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import isEqual from 'lodash.isequal';
import { Picker } from '@react-native-picker/picker';

export default class RNPickerSelect extends PureComponent {
    static defaultProps = {
        value: undefined,
        placeholder: {
            label: 'Select an item...',
            value: null,
            color: '#9EA0A4',
        },
        disabled: false,
        itemKey: null,
        style: {},
        children: null,
        placeholderTextColor: '#C7C7CD', // deprecated
        useNativeAndroidPickerStyle: true,
        hideDoneBar: false, // deprecated
        doneText: 'Done',
        onDonePress: null,
        onUpArrow: null,
        onDownArrow: null,
        onOpen: null,
        onClose: null,
        modalProps: {},
        textInputProps: {},
        pickerProps: {},
        Icon: null,
        InputAccessoryView: null,
    };

    constructor(props) {
        super(props);
        const { items = [], placeholder = {}, value } = this.props;
        const selectedItem = items.find(item => item.value === value) || placeholder;

        this.state = {
            selectedItem,
            showPicker: false,
            animationType: undefined,
            orientation: 'portrait',
        };

        this.onUpArrow = this.onUpArrow.bind(this);
        this.onDownArrow = this.onDownArrow.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
        this.onOrientationChange = this.onOrientationChange.bind(this);
        this.setInputRef = this.setInputRef.bind(this);
        this.togglePicker = this.togglePicker.bind(this);
        this.renderInputAccessoryView = this.renderInputAccessoryView.bind(this);
    }

    _getItems = () => {
        const { items = [], placeholder } = this.props;  
        if (!placeholder || isEqual(placeholder, {})) {
            return items;
        }

        return [placeholder, ...items];
    }

    onUpArrow() {
        const { onUpArrow } = this.props;

        this.togglePicker(false, onUpArrow);
    }

    onDownArrow() {
        const { onDownArrow } = this.props;

        this.togglePicker(false, onDownArrow);
    }

    onValueChange(value, index) {
        const { items, placeholder = {} } = this.props;
        const selectedItem = items.find(item => item.value === value) || placeholder;
        this.setState({ selectedItem });
        const { onValueChange } = this.props;
        onValueChange(value, index);
    }

    onOrientationChange({ nativeEvent }) {
        this.setState({
            orientation: nativeEvent.orientation,
        });
    }

    setInputRef(ref) {
        this.inputRef = ref;
    }

    getPlaceholderStyle() {
        const { placeholder, placeholderTextColor, style } = this.props;
        const { selectedItem } = this.state;

        if (!isEqual(placeholder, {}) && selectedItem.label === placeholder.label) {
            return {
                ...defaultStyles.placeholder,
                color: placeholderTextColor, // deprecated
                ...style.placeholder,
            };
        }
        return {};
    }

    triggerOpenCloseCallbacks() {
        const { onOpen, onClose } = this.props;

        if (!this.state.showPicker && onOpen) {
            onOpen();
        }

        if (this.state.showPicker && onClose) {
            onClose();
        }
    }

    togglePicker(animate = false, postToggleCallback) {
        const { modalProps, disabled } = this.props;

        if (disabled) {
            return;
        }

        if (!this.state.showPicker) {
            Keyboard.dismiss();
        }

        const animationType =
            modalProps && modalProps.animationType ? modalProps.animationType : 'slide';

        this.triggerOpenCloseCallbacks();

        this.setState(
            (prevState) => {
                return {
                    animationType: animate ? animationType : undefined,
                    showPicker: !prevState.showPicker,
                };
            }
        );
    }

    renderPickerItems() {
        return this._getItems().map((item) => {
            return (
                <Picker.Item
                    label={item.label}
                    value={item.value}
                    key={item.key || item.label + item.value}
                    color={item.color}
                />
            );
        });
    }

    renderInputAccessoryView() {
        const {
            InputAccessoryView,
            doneText,
            hideDoneBar,
            onUpArrow,
            onDownArrow,
            style,
        } = this.props;

        // deprecated
        if (hideDoneBar) {
            return null;
        }

        if (InputAccessoryView) {
            return <InputAccessoryView testID="custom_input_accessory_view" />;
        }

        return (
            <View
                style={[defaultStyles.modalViewMiddle, style.modalViewMiddle]}
                testID="input_accessory_view"
            >
                <View style={[defaultStyles.chevronContainer, style.chevronContainer]}>
                    <TouchableOpacity
                        activeOpacity={onUpArrow ? 0.5 : 1}
                        onPress={onUpArrow ? this.onUpArrow : null}
                    >
                        <View
                            style={[
                                defaultStyles.chevron,
                                style.chevron,
                                defaultStyles.chevronUp,
                                style.chevronUp,
                                onUpArrow ? [defaultStyles.chevronActive, style.chevronActive] : {},
                            ]}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={onDownArrow ? 0.5 : 1}
                        onPress={onDownArrow ? this.onDownArrow : null}
                    >
                        <View
                            style={[
                                defaultStyles.chevron,
                                style.chevron,
                                defaultStyles.chevronDown,
                                style.chevronDown,
                                onDownArrow
                                    ? [defaultStyles.chevronActive, style.chevronActive]
                                    : {},
                            ]}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.togglePicker(true);
                    }}
                    hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
                    testID="done_button"
                >
                    <View testID="needed_for_touchable">
                        <Text style={[defaultStyles.done, style.done]}>{doneText}</Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        );
    }

    renderIcon() {
        const { style, Icon } = this.props;

        if (!Icon) {
            return null;
        }

        return (
            <View
                testID="icon_container"
                style={[defaultStyles.iconContainer, style.iconContainer]}
            >
                <Icon testID="icon" />
            </View>
        );
    }

    renderTextInputOrChildren() {
        const { children, style, textInputProps } = this.props;
        const containerStyle =
            Platform.OS === 'ios' ? style.inputIOSContainer : style.inputAndroidContainer;

        if (children) {
            return (
                <View pointerEvents="box-only" style={containerStyle}>
                    {children}
                </View>
            );
        }

        return (
            <View pointerEvents="box-only" style={containerStyle}>
                <TextInput
                    style={[
                        Platform.OS === 'ios' ? style.inputIOS : style.inputAndroid,
                        this.getPlaceholderStyle(),
                    ]}
                    value={this.state.selectedItem.label}
                    ref={this.setInputRef}
                    editable={false}
                    {...textInputProps}
                />
                {this.renderIcon()}
            </View>
        );
    }

    renderIOS() {
        const { style, modalProps, pickerProps } = this.props;

        return (
            <View style={[defaultStyles.viewContainer, style.viewContainer]}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.togglePicker(true);
                    }}
                    testID="ios_touchable_wrapper"
                >
                    {this.renderTextInputOrChildren()}
                </TouchableWithoutFeedback>
                <Modal
                    testID="ios_modal"
                    visible={this.state.showPicker}
                    transparent
                    animationType={this.state.animationType}
                    supportedOrientations={['portrait', 'landscape']}
                    onDismiss={this.triggerDoneCallback}
                    onOrientationChange={this.onOrientationChange}
                    {...modalProps}
                >
                    <TouchableOpacity
                        style={[defaultStyles.modalViewTop, style.modalViewTop]}
                        testID="ios_modal_top"
                        onPress={() => {
                            this.togglePicker(true);
                        }}
                    />
                    {this.renderInputAccessoryView()}
                    <View
                        style={[
                            defaultStyles.modalViewBottom,
                            { height: this.state.orientation === 'portrait' ? 215 : 162 },
                            style.modalViewBottom,
                        ]}
                    >
                        <Picker
                            testID="ios_picker"
                            onValueChange={this.onValueChange}
                            selectedValue={this.state.selectedItem.value}
                            {...pickerProps}
                        >
                            {this.renderPickerItems()}
                        </Picker>
                    </View>
                </Modal>
            </View>
        );
    }

    renderAndroidHeadless() {
        const { disabled, Icon, style, pickerProps } = this.props;

        return (
            <View style={style.headlessAndroidContainer}>
                {this.renderTextInputOrChildren()}
                <Picker
                    style={[
                        Icon ? { backgroundColor: 'transparent' } : {}, // to hide native icon
                        defaultStyles.headlessAndroidPicker,
                        style.headlessAndroidPicker,
                    ]}
                    testID="android_picker_headless"
                    enabled={!disabled}
                    onValueChange={this.onValueChange}
                    selectedValue={this.state.selectedItem.value}
                    {...pickerProps}
                >
                    {this.renderPickerItems()}
                </Picker>
            </View>
        );
    }

    renderAndroidNativePickerStyle() {
        const { disabled, Icon, style, pickerProps } = this.props;

        return (
            <View style={[defaultStyles.viewContainer, style.viewContainer]}>
                <Picker
                    style={[
                        Icon ? { backgroundColor: 'transparent' } : {}, // to hide native icon
                        style.inputAndroid,
                        this.getPlaceholderStyle(),
                    ]}
                    testID="android_picker"
                    enabled={!disabled}
                    onValueChange={this.onValueChange}
                    selectedValue={this.state.selectedItem.value}
                    {...pickerProps}
                >
                    {this.renderPickerItems()}
                </Picker>
                {this.renderIcon()}
            </View>
        );
    }

    render() {
        const { children, useNativeAndroidPickerStyle } = this.props;

        if (Platform.OS === 'ios') {
            return this.renderIOS();
        }

        if (children || !useNativeAndroidPickerStyle) {
            return this.renderAndroidHeadless();
        }
        return this.renderAndroidNativePickerStyle();
    }
}

export const defaultStyles = StyleSheet.create({
    viewContainer: {
        alignSelf: 'stretch',
    },
    iconContainer: {
        position: 'absolute',
        right: 0,
    },
    modalViewTop: {
        flex: 1,
    },
    modalViewMiddle: {
        height: 44,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: '#EFF1F2',
        borderTopWidth: 0.5,
        borderTopColor: '#919498',
    },
    chevronContainer: {
        flexDirection: 'row',
    },
    chevron: {
        width: 15,
        height: 15,
        backgroundColor: 'transparent',
        borderColor: '#D0D4DB',
        borderTopWidth: 1.5,
        borderRightWidth: 1.5,
    },
    chevronUp: {
        marginLeft: 11,
        transform: [{ translateY: 4 }, { rotate: '-45deg' }],
    },
    chevronDown: {
        marginLeft: 22,
        transform: [{ translateY: -5 }, { rotate: '135deg' }],
    },
    chevronActive: {
        borderColor: '#007AFE',
    },
    done: {
        color: '#007AFE',
        fontWeight: 'bold',
        fontSize: 15,
        paddingTop: 1,
        paddingRight: 2,
    },
    modalViewBottom: {
        justifyContent: 'center',
        backgroundColor: '#D0D4DB',
    },
    placeholder: {
        color: '#C7C7CD',
    },
    headlessAndroidPicker: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        color: 'transparent',
        opacity: 0,
    },
});
