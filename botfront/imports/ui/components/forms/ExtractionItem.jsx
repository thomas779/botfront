import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Dropdown, List, Divider, Input,
} from 'semantic-ui-react';
import { can } from '../../../lib/scopes';
import IconButton from '../common/IconButton';

const ExtractionItem = (props) => {
    const {
        slotFilling: {
            type = 'from_entity',
            entity,
            intent,
            not_intent: notIntent,
            value,
        },
        slotFilling,
        intents,
        entities,
        slot,
        onChange,
        onDelete,
        index,
        projectId,
    } = props;

    const entityOptions = useMemo(() => {
        if (!entity || entities.some(({ value: entityName }) => entityName === entity)) {
            return entities;
        }
        return [...entities, { text: entity, value: entity }];
    }, [entity, entities]);

    const getMissingIntents = () => {
        const intentValues = intent || notIntent || [];
        const missingIntents = intentValues.reduce((acc, intentValue) => {
            if (intents.some(({ value: name }) => name === intentValue)) return acc;
            return [...acc, { value: intentValue, text: intentValue }];
        }, []);
        return missingIntents;
    };

    const intentOptions = useMemo(() => {
        const missingIntentOptions = getMissingIntents();
        if (!missingIntentOptions.length) return intents;
        return [...intents, ...missingIntentOptions];
    }, [intents, notIntent, intent]);

    const canEdit = can('stories:w', projectId);
    const intentCondition = useMemo(() => {
        if (Array.isArray(intent)) return 'include';
        if (Array.isArray(notIntent)) return 'exclude';
        return type === 'from_intent' ? 'include' : null;
    }, [slotFilling]);

    const handleIntentConditionChange = (e, { value: selectedCondition }) => {
        if (selectedCondition === intentCondition) return;
        if (!selectedCondition) onChange({ intent: null, not_intent: null });
        if (selectedCondition === 'include') onChange({ intent: notIntent || [], not_intent: null });
        if (selectedCondition === 'exclude') onChange({ intent: null, not_intent: intent || [] });
    };

    const handleChangeIntent = (e, { value: intentSelection }) => {
        const update = intentCondition === 'include'
            ? { intent: intentSelection }
            : { not_intent: intentSelection };
        onChange(update);
    };

    const handleValueSourceChange = (e, { value: source }) => {
        onChange({ type: source, value: null, entity: null });
    };

    const handleChangeValue = (e, { value: newValue }) => {
        onChange({ value: newValue, entity: null });
    };

    const handleChangeEntity = (e, { value: newValue }) => {
        if (!newValue) {
            onChange({ entity: null });
            return;
        }
        onChange({ value: null, entity: newValue });
    };

    const renderSelectEntitiy = () => (
        <>
            <Dropdown
                key={`${!value ? 'empty-' : ''}entity-dropdown-${value}`}
                disabled={!canEdit}
                allowAdditions
                search
                data-cy='entity-value-dropdown'
                className='extraction-dropdown entity'
                selection
                clearable
                placeholder='select an entity'
                options={entityOptions}
                value={entity}
                onChange={handleChangeEntity}
            />
        </>
    );

    const rederCategoricalDropdown = () => {
        const { categories } = slot;
        return (
            <Dropdown
                disabled={!canEdit}
                data-cy='category-value-dropdown'
                className='extraction-dropdown'
                selection
                placeholder='select a category'
                options={categories.map(category => ({ value: category, text: category }))}
                value={value}
                onChange={handleChangeValue}
            />
        );
    };

    const renderBoolDropdown = () => (
        <Dropdown
            disabled={!canEdit}
            data-cy='bool-value-dropdown'
            className='extraction-dropdown'
            selection
            options={[
                { value: true, text: 'true' },
                { value: false, text: 'false' },
            ]}
            value={value}
            onChange={handleChangeValue}
        />
    );

    const renderSlotInput = inputType => (
        <Input
            disabled={!canEdit}
            data-cy='slot-value-input'
            className='extraction-field'
            placeholder='enter a value'
            type={inputType}
            value={value || ''}
            onChange={handleChangeValue}
        />
    );

    const renderSlotValue = () => {
        switch (slot.type) {
        case 'categorical':
            return rederCategoricalDropdown();
        case 'bool':
            return renderBoolDropdown();
        case 'text':
            return renderSlotInput('text');
        case 'number':
            return renderSlotInput('number');
        default:
            return renderSlotInput();
        }
    };

    const renderIntentSelect = () => (
        <div className='extraction-line' key={`extraction-condition-${index}`}>
            <Dropdown
                disabled={!canEdit}
                data-cy='intent-condition-dropdown'
                clearable={type !== 'from_intent'}
                placeholder='add an intent condition'
                className='extraction-dropdown condition-dropdown'
                selection
                options={[
                    { value: 'include', text: 'if the intent is one of' },
                    { value: 'exclude', text: 'if the intent is NOT one of' },
                ]}
                value={intentCondition}
                onChange={handleIntentConditionChange}
            />
            {intentCondition && (
                <Dropdown
                    disabled={!canEdit}
                    data-cy='intent-condition-multiselect'
                    clearable
                    placeholder='select included/excluded intents'
                    className='extraction-dropdown'
                    selection
                    allowAdditions
                    multiple
                    search
                    options={intentOptions}
                    value={(intentCondition === 'include' ? intent : notIntent) || []}
                    onChange={handleChangeIntent}
                />
            )}
        </div>
    );

    const renderValueFromIntent = () => (
        <div>
            {renderIntentSelect()}
            <span>the value is</span>
            {renderSlotValue()}
        </div>
    );
    return (
        <List.Item className={`${canEdit ? '' : 'read-only'}`} data-cy='extraction-item-container'>
            <div>
                {index !== 0 && <Divider horizontal className='extraction-item-divider'>OR</Divider>}
                <div className='extraction-option-buttons'>
                    {canEdit && <IconButton icon='trash' color='grey' onClick={() => onDelete(index)} />}
                </div>
                <span>
                    Get the slot value:
                </span>
                <Dropdown
                    disabled={!canEdit}
                    data-cy='extraction-source-dropdown'
                    className='extraction-dropdown'
                    selection
                    options={[
                        { value: 'from_text', text: 'From the user message' },
                        { value: 'from_intent', text: 'Conditionally on the intent' },
                        { value: 'from_entity', text: 'From the entity' },
                    ]}
                    value={type || 'from_entity'}
                    onChange={handleValueSourceChange}
                />
                {type === 'from_intent' && renderValueFromIntent()}
                {type === 'from_entity' && renderSelectEntitiy()}
            </div>
            {type !== 'from_intent' && renderIntentSelect()}
        </List.Item>
    );
};

ExtractionItem.propTypes = {
    intents: PropTypes.array.isRequired,
    slotFilling: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    entities: PropTypes.array,
    slot: PropTypes.object,
    index: PropTypes.number.isRequired,
    onDelete: PropTypes.func.isRequired,
    projectId: PropTypes.string.isRequired,
};

ExtractionItem.defaultProps = {
    slotFilling: {},
    entities: [],
    slot: {},
};

export default ExtractionItem;