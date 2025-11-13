import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { isRTL } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  value?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  loading = false,
  value: controlledValue,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState<string>('');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }
    onSearch(text);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search color="#999" size={20} />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          returnKeyType="search"
          autoCorrect={false}
        />

        {loading ? (
          <ActivityIndicator size="small" color="#999" />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <X color="#999" size={20} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

interface SearchBarWithSuggestionsProps extends SearchBarProps {
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

export function SearchBarWithSuggestions({
  placeholder = 'Search...',
  onSearch,
  loading = false,
  value: controlledValue,
  suggestions = [],
  onSelectSuggestion,
}: SearchBarWithSuggestionsProps) {
  const [internalValue, setInternalValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }
    onSearch(text);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onSearch('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (controlledValue === undefined) {
      setInternalValue(suggestion);
    }
    onSearch(suggestion);
    onSelectSuggestion?.(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search color="#999" size={20} />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setShowSuggestions(true)}
          returnKeyType="search"
          autoCorrect={false}
        />

        {loading ? (
          <ActivityIndicator size="small" color="#999" />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <X color="#999" size={20} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
  },
  searchBar: {
    flexDirection: (isRTL ? 'row-reverse' : 'row') as const,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    textAlign: (isRTL ? 'right' : 'left') as const,
  },
  suggestionsContainer: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2d3748',
    textAlign: (isRTL ? 'right' : 'left') as const,
  },
});
