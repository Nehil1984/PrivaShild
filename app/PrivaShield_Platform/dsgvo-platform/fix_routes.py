import re
import sys

def fix_routes(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Inject the app.param interceptor right after the first app.use or inside registerRoutes
    interceptor_code = """
  app.param('mid', async (req: any, res: any, next: any, mid: string) => {
    let mandantId = Number(mid);
    if (isNaN(mandantId)) {
      const mandant = await storage.getMandantByZentraleId(mid);
      if (!mandant) return res.status(404).json({ message: "Mandant nicht gefunden" });
      mandantId = mandant.id;
    }
    req.mandantId = mandantId;
    next();
  });
"""
    if "app.param('mid'" not in content:
        # find the function definition `export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {`
        target = "export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {"
        if target in content:
            content = content.replace(target, target + interceptor_code)
        else:
            print("Could not find registerRoutes")
            return

    # 2. Replace all Number(req.params.id) and Number(req.params.mid) inside mandanten/:mid routes with req.mandantId
    # It's safer to just replace `Number(req.params.mid)` with `req.mandantId` globally where it appears
    content = content.replace("Number(req.params.mid)", "req.mandantId")

    # And for those that I missed: Number(req.params.id) in /api/mandanten/:mid routes
    # I'll just use a regex to find them.
    # We only want to replace `req.params.id` in the handlers that use `:mid`!
    
    # We can do this manually for the 7 routes we identified:
    # 1300: const mandantId = Number(req.params.id);
    # 1326: const mandantId = Number(req.params.id);
    # ...
    
    # Let's just fix all "const mandantId = Number(req.params.id);" inside the specific block.
    # Actually, if I look at `req.params.id`, it's used in `/api/users/:id`, `/api/mandanten-gruppen/:id`, `/api/vorlagenpakete/:id`, etc.
    # So I must only replace it where the route actually has `:mid`.
    
    lines = content.split('\n')
    inside_mid_route = False
    for i in range(len(lines)):
        if "api/mandanten/:mid" in lines[i]:
            inside_mid_route = True
        elif "app.get(" in lines[i] or "app.post(" in lines[i] or "app.put(" in lines[i] or "app.delete(" in lines[i] or "app.patch(" in lines[i]:
            # If it's a new route and it doesn't have :mid, we aren't in a :mid route anymore
            if "api/mandanten/:mid" not in lines[i]:
                inside_mid_route = False
        
        if inside_mid_route and "req.params.id" in lines[i]:
            lines[i] = lines[i].replace("Number(req.params.id)", "req.mandantId")
            lines[i] = lines[i].replace("req.params.id", "req.mandantId") # for any other uses

    content = '\n'.join(lines)

    with open(filepath, 'w') as f:
        f.write(content)
    print("Fixed routes.ts successfully.")

if __name__ == "__main__":
    fix_routes("server/routes.ts")
