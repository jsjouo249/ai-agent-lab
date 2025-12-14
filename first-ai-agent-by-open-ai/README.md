# First AI Agent with OpenAI
노마드코더의 강의를 보고, OpenAI의 Function Calling(Tool Use)을 활용한 간단한 AI Agent 구현

## 코드 흐름 (main.ipynb)
### 1. 초기 설정 (Cell 1)
```python
from dotenv import load_dotenv
import openai, json

load_dotenv()
client = openai.OpenAI()
messages = []
```

- 대화 히스토리를 저장할 `messages`

### 2. Tool 함수 정의 (Cell 2)
```python
def get_weather(city):
  return f"The weather in 33 degrees celcius."

FUNCTION_MAP = {
  'get_weather': get_weather
}
```

- `FUNCTION_MAP`: 함수 이름(문자열)과 실제 함수를 매핑

### 3. Tool 스키마 정의 (Cell 3)
```python
TOOLS = [
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "A function to get the weather of a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "The name of the city to get the weather of"
          }
        },
        "required": ["city"]
      }
    }
  }
]
```

- OpenAI API에 전달할 Tool 정의 (JSON Schema 형식)
- AI가 어떤 함수를 사용할 수 있는지, 어떤 파라미터가 필요한지 명시

### 4. AI 응답 처리 로직 (Cell 4)

#### `process_ai_response(message)` 함수
AI의 응답을 처리하는 함수:

1. **Tool Call이 있는 경우:**
   - Assistant 메시지를 `messages`에 추가 (tool_calls 포함)
   - 각 tool_call에 대해:
     - 함수 이름과 arguments 추출
     - `FUNCTION_MAP`에서 해당 함수를 찾아 실행
     - 결과를 `tool` role 메시지로 `messages`에 추가
   - `call_ai()`를 재귀 호출하여 AI가 결과를 해석하도록 함

2. **Tool Call이 없는 경우:**
   - 일반 텍스트 응답으로 처리
   - 사용자에게 응답 출력

#### `call_ai()` 함수
```python
def call_ai():
  response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=TOOLS,
  )
  process_ai_response(response.choices[0].message)
```

- 전체 대화 히스토리(`messages`)와 사용 가능한 Tool(`TOOLS`)을 전달

### 5. 메인 루프 (Cell 5)
```python
while True:
    message = input("Send a message to the LLM...")
    if message == "quit" or message == "q":
        break
    else:
        messages.append({"role": "user", "content": message})
        call_ai()
```

- 사용자 입력을 받아 대화를 진행
- "quit" 또는 "q" 입력 시 종료

## 전체 흐름도

```
사용자 입력
    ↓
messages에 user 메시지 추가
    ↓
call_ai() → OpenAI API 호출
    ↓
AI 응답 수신
    ↓
┌─────────────────────────────────────┐
│ tool_calls가 있는가?                 │
└─────────────────────────────────────┘
    │                    │
   Yes                   No
    ↓                    ↓
함수 실행             응답 출력
    ↓                  (종료)
결과를 tool 메시지로 추가
    ↓
call_ai() 재귀 호출
    ↓
최종 응답 출력
```

## Messages 구조 예시

실행 후 `messages` 리스트의 구조:
```python
[
  {'role': 'user', 'content': 'what is the weather in seoul'},
  {'role': 'assistant', 'content': '', 'tool_calls': [...]},
  {'role': 'tool', 'tool_call_id': '...', 'name': 'get_weather', 'content': '...'},
  {'role': 'assistant', 'content': 'The weather in Seoul is currently 33 degrees Celsius.'}
]
```

## OpenAI Chat Completions API - Message Roles

### Role 요약표

| Role | 역할 | 필수 파라미터 | 선택 파라미터 |
|------|------|--------------|--------------|
| **developer** | 개발자 지시사항 (system의 새 버전) | `content`, `role` | `name` |
| **system** | AI의 행동/페르소나 설정 | `content`, `role` | `name` |
| **user** | 사용자 입력 메시지 | `content`, `role` | `name` |
| **assistant** | AI의 응답 | `role` | `content`, `tool_calls`, `audio`, `refusal`, `name` |
| **tool** | Tool 실행 결과 반환 | `content`, `role`, `tool_call_id` | - |
| **function** | ⚠️ Deprecated (tool로 대체됨) | `content`, `name`, `role` | - |

### 각 Role 상세 설명

#### 1. `developer`
```python
{"role": "developer", "content": "You are a helpful assistant."}
```
- **용도**: 모델에게 지시사항을 제공 (system의 새 버전)
- **특징**: system보다 우선순위가 높음

#### 2. `system`
```python
{"role": "system", "content": "You are a weather expert."}
```
- **용도**: AI의 행동, 톤, 페르소나를 설정
- **특징**: 대화 시작 시 한 번 설정

#### 3. `user`
```python
{"role": "user", "content": "What is the weather in Seoul?"}
```
- **용도**: 사용자의 질문/요청
- **특징**: 텍스트, 이미지 등 다양한 content 타입 지원

#### 4. `assistant`
```python
# 일반 응답
{"role": "assistant", "content": "The weather is sunny."}

# Tool 호출 시
{"role": "assistant", "content": "", "tool_calls": [...]}
```
- **용도**: AI의 응답을 기록
- **특징**: `tool_calls`가 있으면 `content`는 선택적

#### 5. `tool`
```python
{"role": "tool", "tool_call_id": "call_abc123", "content": "33 degrees"}
```
- **용도**: Tool 실행 결과를 AI에게 반환
- **필수**: `tool_call_id`로 어떤 호출에 대한 응답인지 명시

#### 6. `function` (Deprecated)
```python
{"role": "function", "name": "get_weather", "content": "33 degrees"}
```
- **상태**: ⚠️ `tool`로 대체되어 더 이상 사용 권장하지 않음
