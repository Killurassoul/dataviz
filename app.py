import dash
from dash import dcc, html, Input, Output
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Load the dataset
url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/student-mat.csv"
df = pd.read_csv(url)

# Initialize the Dash app
app = dash.Dash(__name__, external_stylesheets=[
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;800&display=swap",
    "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
])

# Layout with Tailwind CSS classes to mimic the React premium design
app.layout = html.Div(className="min-h-screen bg-gray-900 text-white font-sans", children=[
    
    # Header
    html.Div(className="p-8 border-b border-gray-800 bg-gray-900 bg-opacity-50 backdrop-blur-md sticky top-0 z-50", children=[
        html.Div(className="max-w-7xl mx-auto flex justify-between items-center", children=[
            html.Div(children=[
                html.H1("Nexus Student Analytics", className="text-3xl font-bold tracking-tight text-white"),
                html.P("Premium Data Visualization Dashboard", className="text-gray-400 text-sm mt-1")
            ]),
            html.Div(className="flex gap-4", children=[
                html.Div(className="flex items-center bg-gray-800 rounded-px px-4 py-2 border border-gray-700", children=[
                    html.Span("School: ", className="text-gray-500 mr-2 text-xs font-bold uppercase"),
                    dcc.Dropdown(
                        id='school-filter',
                        options=[{'label': 'Gabriel Pereira', 'value': 'GP'}, {'label': 'Mousinho da Silveira', 'value': 'MS'}],
                        placeholder="All Schools",
                        className="bg-transparent border-none text-black w-40 h-8"
                    )
                ]),
                html.Div(className="flex items-center bg-gray-800 rounded-px px-4 py-2 border border-gray-700", children=[
                    html.Span("Sex: ", className="text-gray-500 mr-2 text-xs font-bold uppercase"),
                    dcc.Dropdown(
                        id='sex-filter',
                        options=[{'label': 'Female', 'value': 'F'}, {'label': 'Male', 'value': 'M'}],
                        placeholder="All Genders",
                        className="bg-transparent border-none text-black w-32 h-8"
                    )
                ])
            ])
        ])
    ]),

    # Main Content
    html.Div(className="max-w-7xl mx-auto p-8 space-y-8", children=[
        
        # KPI Row
        html.Div(className="grid grid-cols-1 md:grid-cols-3 gap-6", children=[
            html.Div(id='kpi-total', className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl"),
            html.Div(id='kpi-avg-g3', className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl"),
            html.Div(id='kpi-avg-study', className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl"),
        ]),

        # Charts Section
        html.Div(className="grid grid-cols-1 lg:grid-cols-2 gap-8", children=[
            html.Div(className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl", children=[
                html.H3("Grade Distribution (G3)", className="text-lg font-semibold mb-4"),
                dcc.Graph(id='hist-g3')
            ]),
            html.Div(className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl", children=[
                html.H3("Study Time vs Final Grade", className="text-lg font-semibold mb-4"),
                dcc.Graph(id='scatter-study')
            ]),
            html.Div(className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl", children=[
                html.H3("Performance by Gender", className="text-lg font-semibold mb-4"),
                dcc.Graph(id='box-gender')
            ]),
            html.Div(className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl", children=[
                html.H3("Absence Impact Analysis", className="text-lg font-semibold mb-4"),
                dcc.Graph(id='bubble-absences')
            ]),
        ]),

        # Heatmap
        html.Div(className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl", children=[
            html.H3("Feature Correlation Matrix", className="text-lg font-semibold mb-4"),
            dcc.Graph(id='heatmap-corr')
        ])
    ]),
    
    # Footer
    html.Footer(className="p-8 border-t border-gray-800 text-center text-gray-600 text-xs tracking-widest", children=[
        html.P("© 2026 NEXUS DATA SYSTEMS | DASH PLATFORM CORE")
    ])
])

# Callbacks for interactivity
@app.callback(
    [Output('kpi-total', 'children'),
     Output('kpi-avg-g3', 'children'),
     Output('kpi-avg-study', 'children'),
     Output('hist-g3', 'figure'),
     Output('scatter-study', 'figure'),
     Output('box-gender', 'figure'),
     Output('bubble-absences', 'figure'),
     Output('heatmap-corr', 'figure')],
    [Input('school-filter', 'value'),
     Input('sex-filter', 'value')]
)
def update_dashboard(school, sex):
    # Filter data
    filtered_df = df.copy()
    if school:
        filtered_df = filtered_df[filtered_df['school'] == school]
    if sex:
        filtered_df = filtered_df[filtered_df['sex'] == sex]

    # Metrics
    total = len(filtered_df)
    avg_g3 = round(filtered_df['G3'].mean(), 2) if total > 0 else 0
    avg_study = round(filtered_df['studytime'].mean(), 2) if total > 0 else 0

    kpi_template = lambda t, v, c: [
        html.P(t, className="text-gray-500 text-xs font-bold uppercase tracking-wider"),
        html.H2(str(v), className=f"text-4xl font-bold mt-2 {c}")
    ]

    # Figures
    theme = {
        'template': 'plotly_dark',
        'layout': {
            'paper_bgcolor': 'rgba(0,0,0,0)',
            'plot_bgcolor': 'rgba(0,0,0,0)',
            'font': {'color': '#94a3b8'}
        }
    }

    fig_hist = px.histogram(filtered_df, x="G3", nbins=20, color_discrete_sequence=['#6366f1'])
    fig_hist.update_layout(theme['layout'])

    fig_scatter = px.scatter(filtered_df, x="studytime", y="G3", trendline="ols", color_discrete_sequence=['#a855f7'])
    fig_scatter.update_layout(theme['layout'])

    fig_box = px.box(filtered_df, x="sex", y="G3", color="sex", color_discrete_map={'F': '#f472b6', 'M': '#6366f1'})
    fig_box.update_layout(theme['layout'])

    fig_bubble = px.scatter(filtered_df, x="absences", y="G3", size="failures", color="G3", color_continuous_scale='Viridis')
    fig_bubble.update_layout(theme['layout'])

    # Simpler correlation for example purposes
    corr = filtered_df[['G1', 'G2', 'G3', 'absences', 'studytime']].corr()
    fig_heat = px.imshow(corr, color_continuous_scale='Magma')
    fig_heat.update_layout(theme['layout'])

    return (
        kpi_template("Total Students", total, "text-indigo-400"),
        kpi_template("Mean G3 Score", avg_g3, "text-purple-400"),
        kpi_template("Avg Study Time", avg_study, "text-emerald-400"),
        fig_hist, fig_scatter, fig_box, fig_bubble, fig_heat
    )

if __name__ == '__main__':
    app.run_server(debug=True)
