"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CallStatus {
    id: string;
    status: number;
    message: string;
    timestamp: string;
}

// Словарь с промтами для разных типов агентов
const agentPrompts = {
    "tattoo_salon": {
        label: "Продавец в тату-салоне",
        prompt: "Ты работаешь продавцом в тату-салоне. Твоя задача - заинтересовать клиента услугами салона, рассказать о мастерах, ценах и записать на консультацию."
    },
    "english_courses": {
        label: "Менеджер курсов английского языка",
        prompt: "Ты менеджер школы английского языка. Твоя задача - рассказать о курсах, методиках обучения, преподавателях и записать клиента на пробный урок."
    }
};

const languages = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "Английский" }
];

export default function ReservationForm() {
    const [form, setForm] = useState({
        phone: "",
        agentType: "",
        language: "ru", // По умолчанию русский
    });

    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<{ error?: string; message?: string } | null>(null);
    const [callStatuses, setCallStatuses] = useState<Record<string, CallStatus[]>>({});

    useEffect(() => {
        const isProduction = process.env.NODE_ENV === 'production';
        const wsUrl = isProduction ? 'wss://calls.smart-lab.app/ws/' : 'ws://localhost:3001';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.callId && data.status && data.message) {
                const newStatus: CallStatus = {
                    id: data.callId,
                    status: data.status,
                    message: data.message,
                    timestamp: new Date().toLocaleTimeString()
                };

                setCallStatuses(prev => {
                    const existingStatuses = prev[data.callId] || [];
                    return {
                        ...prev,
                        [data.callId]: [...existingStatuses, newStatus]
                    };
                });
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Валидация
        if (!form.phone.trim()) {
            setResponse({ error: "Пожалуйста, введите номер телефона" });
            return;
        }
        if (!form.agentType) {
            setResponse({ error: "Пожалуйста, выберите тип агента" });
            return;
        }

        setLoading(true);
        setResponse(null);
        const callId = `call-${Date.now()}`;

        const selectedAgent = agentPrompts[form.agentType as keyof typeof agentPrompts];
        
        const payload = {
            "Phone": form.phone,
            "Agent Type": selectedAgent.label,
            "Agent Prompt": selectedAgent.prompt,
            "Language": form.language,
            "TG user id": "web-user-" + Math.floor(Math.random() * 1000000),
            "ID": callId,
        };

        try {
            const res = await fetch("https://artemmmka.app.n8n.cloud/webhook-test/12209e1a-4b3a-4b6e-8d6b-fd0dd482850c", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            setResponse(data);
        } catch (error) {
            setResponse({ error: "Произошла ошибка при отправке запроса." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-2xl shadow-2xl rounded-2xl border-0">
                <CardContent className="space-y-6 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">AI Звонок</h2>
                    <p className="text-gray-600 text-center">Выберите тип агента и номер телефона для звонка</p>

                    <div className="space-y-4">
                        {/* Поле ввода номера телефона */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Номер телефона *
                            </label>
                            <Input
                                name="phone"
                                placeholder="+7 (999) 123-45-67"
                                value={form.phone}
                                onChange={handleChange}
                                className="rounded-xl"
                                type="tel"
                            />
                        </div>

                        {/* Выпадающий список для выбора типа агента */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Тип агента *
                            </label>
                            <select
                                name="agentType"
                                value={form.agentType}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Выберите тип агента</option>
                                {Object.entries(agentPrompts).map(([key, agent]) => (
                                    <option key={key} value={key}>
                                        {agent.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Выбор языка */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Язык разговора
                            </label>
                            <select
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-center">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-2 text-lg rounded-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-5 h-5" /> Звоню...
                                </span>
                            ) : (
                                "Позвонить"
                            )}
                        </Button>
                    </div>

                    {response && (
                        <div className="mt-6 text-sm text-center">
                            {response.error ? (
                                <div className="text-red-500 font-medium">{response.error}</div>
                            ) : (
                                <div className="text-green-600 font-medium">{response.message || "Звонок инициирован!"}</div>
                            )}
                        </div>
                    )}

                    {Object.keys(callStatuses).length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-700 mb-2 text-center">Статусы звонков</h3>
                            {Object.entries(callStatuses).map(([callId, statuses]) => (
                                <div key={callId} className="mb-4 p-3 border rounded-md">
                                     <p className="text-sm font-semibold text-gray-600">ID звонка: {callId}</p>
                                     <ul className="mt-2 space-y-1">
                                        {statuses.map((status, index) => (
                                            <li key={index} className="text-sm text-gray-800">
                                                <span className="font-mono text-xs bg-gray-200 rounded px-1 py-0.5 mr-2">{status.timestamp}</span>
                                                <span>{status.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
