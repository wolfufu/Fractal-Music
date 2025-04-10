document.addEventListener('DOMContentLoaded', async () => {
    // Состояние приложения
    const state = {
        settings: {},
        isLoading: false,
        isInitialized: false
    };

    // DOM элементы
    const elements = {
        // Основные настройки
        tempo: document.getElementById('tempo'),
        tempoValue: document.getElementById('tempo-value'),
        rootNote: document.getElementById('root-note'),
        scale: document.getElementById('scale'),
        
        // Инструменты
        melodyInstr: document.getElementById('melody-instr'),
        bassInstr: document.getElementById('bass-instr'),
        drumInstr: document.getElementById('drum-instr'),
        
        // Фрактальные параметры
        lSystemIter: document.getElementById('l-system-iter'),
        lSystemIterValue: document.getElementById('l-system-iter-value'),
        chaosLevel: document.getElementById('chaos-level'),
        chaosLevelValue: document.getElementById('chaos-level-value'),
        drumLevels: document.getElementById('drum-levels'),
        drumLevelsValue: document.getElementById('drum-levels-value'),
        
        // Эффекты
        arpeggio: document.getElementById('arpeggio'),
        reverb: document.getElementById('reverb'),
        swing: document.getElementById('swing'),
        swingValue: document.getElementById('swing-value'),
        humanize: document.getElementById('humanize'),
        humanizeValue: document.getElementById('humanize-value'),
        
        // Громкость
        melodyVol: document.getElementById('melody-vol'),
        melodyVolValue: document.getElementById('melody-vol-value'),
        bassVol: document.getElementById('bass-vol'),
        bassVolValue: document.getElementById('bass-vol-value'),
        drumsVol: document.getElementById('drums-vol'),
        drumsVolValue: document.getElementById('drums-vol-value'),
        
        // Управление
        generateBtn: document.getElementById('generate-btn'),
        statusMessage: document.getElementById('status-message')
    };

    // Проверка наличия всех элементов в DOM
    function checkElements() {
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Element not found: ${key}`);
                return false;
            }
        }
        return true;
    }

    // Инициализация приложения
    async function initApp() {
        try {
            if (!checkElements()) {
                throw new Error("Не удалось найти все необходимые элементы на странице");
            }

            setLoading(true);
            showStatus("Загрузка настроек...");
            
            const response = await fetchWithTimeout('/api/settings', {
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || "Неизвестная ошибка");
            }
            
            // Сохраняем настройки
            state.settings = data.default_settings || {};
            state.scales = data.scales || [];
            state.instruments = data.instruments || {};
            
            // Инициализация интерфейса
            initScaleSelect();
            initInstrumentSelects();
            setDefaultValues();
            setupEventListeners();
            
            state.isInitialized = true;
            showStatus("Готово к генерации музыки!", "success");
        } catch (error) {
            console.error("Ошибка инициализации:", error);
            showStatus(`Ошибка: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    // Функция fetch с таймаутом
    async function fetchWithTimeout(resource, options = {}) {
        const { timeout = 8000 } = options;
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
        }).catch(() => {
            throw new Error("Превышено время ожидания сервера");
        });
        
        clearTimeout(id);
        return response;
    }

    // Инициализация элементов интерфейса
    function initScaleSelect() {
        if (!elements.scale) return;
        
        elements.scale.innerHTML = '';
        state.scales.forEach(scale => {
            const option = document.createElement('option');
            option.value = scale;
            option.textContent = scale.charAt(0).toUpperCase() + scale.slice(1);
            elements.scale.appendChild(option);
        });
    }

    function initInstrumentSelects() {
        initInstrumentSelect(elements.melodyInstr);
        initInstrumentSelect(elements.bassInstr);
        initInstrumentSelect(elements.drumInstr);
    }

    function initInstrumentSelect(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        for (const [name, value] of Object.entries(state.instruments)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            selectElement.appendChild(option);
        }
    }

    // Установка значений по умолчанию
    function setDefaultValues() {
        // Основные настройки
        safeSetControlValue(elements.tempo, elements.tempoValue, state.settings.tempo, 120);
        safeSetControlValue(elements.rootNote, null, state.settings.root_note, 60);
        safeSetControlValue(elements.scale, null, state.settings.scale, 'major');
        
        // Инструменты
        safeSetControlValue(elements.melodyInstr, null, state.settings.instruments?.melody, 5);
        safeSetControlValue(elements.bassInstr, null, state.settings.instruments?.bass, 38);
        safeSetControlValue(elements.drumInstr, null, state.settings.instruments?.drums, 118);
        
        // Фрактальные параметры
        safeSetControlValue(elements.lSystemIter, elements.lSystemIterValue, 
                       state.settings.fractal_params?.l_system_iter, 6);
        safeSetControlValue(elements.chaosLevel, elements.chaosLevelValue, 
                       (state.settings.fractal_params?.chaos_level || 0.2) * 100, 20);
        safeSetControlValue(elements.drumLevels, elements.drumLevelsValue, 
                       state.settings.fractal_params?.drum_levels, 5);
        
        // Эффекты
        safeSetControlValue(elements.arpeggio, null, state.settings.effects?.arpeggio, true);
        safeSetControlValue(elements.reverb, null, state.settings.effects?.reverb, false);
        safeSetControlValue(elements.swing, elements.swingValue, 
                       (state.settings.effects?.swing || 0.3) * 100, 30);
        safeSetControlValue(elements.humanize, elements.humanizeValue, 
                       (state.settings.effects?.humanize || 0.2) * 100, 20);
        
        // Громкость
        safeSetControlValue(elements.melodyVol, elements.melodyVolValue, 
                       state.settings.effects?.melody_volume, 110);
        safeSetControlValue(elements.bassVol, elements.bassVolValue, 
                       state.settings.effects?.bass_volume, 115);
        safeSetControlValue(elements.drumsVol, elements.drumsVolValue, 
                       state.settings.effects?.drums_volume, 127);
    }

    function safeSetControlValue(element, displayElement, value, defaultValue) {
        if (!element) {
            console.error('Element not found for value setting');
            return;
        }
        
        const finalValue = value !== undefined ? value : defaultValue;
        
        if (element.type === 'checkbox') {
            element.checked = Boolean(finalValue);
        } else if (element.tagName === 'SELECT') {
            element.value = finalValue;
        } else if (element.tagName === 'INPUT') {
            element.value = finalValue;
        }
        
        if (displayElement) {
            displayElement.textContent = finalValue;
        }
    }

    // Генерация музыки
    async function generateMusic() {
        if (!state.isInitialized || state.isLoading) return;
        
        try {
            setLoading(true);
            showStatus("Генерация музыки...");
            
            // Подготовка настроек
            const settings = {
                tempo: getValidNumber(elements.tempo?.value, 120, 40, 200),
                root_note: getValidNumber(elements.rootNote?.value, 60, 0, 127),
                scale: elements.scale?.value || 'major',
                instruments: {
                    melody: getValidNumber(elements.melodyInstr?.value, 5, 0, 127),
                    bass: getValidNumber(elements.bassInstr?.value, 38, 0, 127),
                    drums: getValidNumber(elements.drumInstr?.value, 118, 0, 127)
                },
                fractal_params: {
                    l_system_iter: getValidNumber(elements.lSystemIter?.value, 6, 3, 10),
                    chaos_level: getValidNumber(elements.chaosLevel?.value, 20, 0, 100) / 100,
                    drum_levels: getValidNumber(elements.drumLevels?.value, 5, 2, 7)
                },
                effects: {
                    arpeggio: elements.arpeggio?.checked || true,
                    reverb: elements.reverb?.checked || false,
                    swing: getValidNumber(elements.swing?.value, 30, 0, 100) / 100,
                    humanize: getValidNumber(elements.humanize?.value, 20, 0, 100) / 100,
                    melody_volume: getValidNumber(elements.melodyVol?.value, 110, 0, 127),
                    bass_volume: getValidNumber(elements.bassVol?.value, 115, 0, 127),
                    drums_volume: getValidNumber(elements.drumsVol?.value, 127, 0, 127)
                }
            };
            
            // Отправка запроса
            const response = await fetchWithTimeout('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings }),
                timeout: 15000
            });
            
            // Обработка ответа
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Ошибка сервера");
            }
            
            // Скачивание файла
            const blob = await response.blob();
            downloadBlob(blob, 'fractal_music.mid');
            
            showStatus("Музыка успешно сгенерирована!", "success");
        } catch (error) {
            console.error("Ошибка генерации:", error);
            showStatus(`Ошибка: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    // Вспомогательные функции
    function getValidNumber(value, defaultValue, min, max) {
        const num = Number(value);
        return isNaN(num) ? defaultValue : Math.min(Math.max(num, min), max);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        if (elements.generateBtn) {
            elements.generateBtn.disabled = isLoading;
            elements.generateBtn.innerHTML = isLoading 
                ? '<span class="btn-icon">⏳</span> Генерация...' 
                : '<span class="btn-icon">🎵</span> Сгенерировать музыку';
        }
    }

    function showStatus(message, type = "") {
        if (elements.statusMessage) {
            elements.statusMessage.textContent = message;
            elements.statusMessage.className = `status-message ${type}`;
        }
    }

    // Назначение обработчиков событий
    function setupEventListeners() {
        // Обновление значений ползунков
        const connectSliderToDisplay = (slider, display) => {
            if (slider && display) {
                slider.addEventListener('input', () => {
                    display.textContent = slider.value;
                });
            }
        };

        connectSliderToDisplay(elements.tempo, elements.tempoValue);
        connectSliderToDisplay(elements.lSystemIter, elements.lSystemIterValue);
        connectSliderToDisplay(elements.chaosLevel, elements.chaosLevelValue);
        connectSliderToDisplay(elements.drumLevels, elements.drumLevelsValue);
        connectSliderToDisplay(elements.swing, elements.swingValue);
        connectSliderToDisplay(elements.humanize, elements.humanizeValue);
        connectSliderToDisplay(elements.melodyVol, elements.melodyVolValue);
        connectSliderToDisplay(elements.bassVol, elements.bassVolValue);
        connectSliderToDisplay(elements.drumsVol, elements.drumsVolValue);
        
        // Кнопка генерации
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', generateMusic);
        }
    }

    // Запуск приложения
    initApp();
});