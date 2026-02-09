import dotenv
dotenv.load_dotenv()

from crewai import Agent, Crew, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class TranslatorCrew:
    
    @agent
    def translator_agent(self):
        return Agent(
            config=self.agents_config["translator_agent"],
        )

    @task
    def translate_task(self):
        return Task(
            config=self.tasks_config["translate_task"],
        )

    @crew
    def assistant_crew(self):
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True,
        )

TranslatorCrew().assistant_crew().kickoff(inputs={"sentence": "Hello, how are you?"})